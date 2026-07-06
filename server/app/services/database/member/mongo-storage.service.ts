import * as fs from 'fs';
import { unlink } from 'fs/promises';
import { Db, GridFSBucket, MongoClient, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { Service } from 'typedi';

@Service()
export class MongoStorageService {
    private client: MongoClient;
    private db: Db | null = null;

    constructor() {
        const uri = process.env.MONGO_URI;
        this.client = new MongoClient(uri, {
            monitorCommands: false, // facultatif
        });
    }

    private async connectIfNeeded(): Promise<Db> {
        if (!this.db) {
            await this.client.connect();
            this.db = this.client.db(); // tu peux faire this.client.db('FFME') si besoin
        }
        return this.db;
    }

    private async getBucket(bucketName: string): Promise<GridFSBucket> {
        const db = await this.connectIfNeeded();
        return new GridFSBucket(db, { bucketName });
    }

    async uploadTempFiles(
        membershipId: string,
        files: { [fieldName: string]: { path: string; originalname: string; mimetype: string } },
    ): Promise<{ success: boolean; ids?: { [key: string]: string }; error?: string }> {
        try {
            const bucket = await this.getBucket('membership_temp');
            const ids: { [key: string]: string } = {};

            for (const [key, file] of Object.entries(files)) {
                const readStream = fs.createReadStream(file.path);
                const uploadStream = bucket.openUploadStream(file.originalname, {
                    metadata: {
                        membershipId,
                        field: key,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        status: 'temp',
                    },
                });

                await new Promise<void>((resolve, reject) => {
                    readStream.pipe(uploadStream).on('error', reject).on('finish', resolve);
                });

                ids[key] = uploadStream.id.toString();
                await unlink(file.path);
            }

            return { success: true, ids };
        } catch (error: any) {
            console.error('❌ Erreur uploadTempFiles:', error);
            return { success: false, error: error.message };
        }
    }

    async moveTempToValid(membershipId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const db = await this.connectIfNeeded();
            const tempBucket = await this.getBucket('membership_temp');
            const validBucket = await this.getBucket('membership_valid');

            const tempFiles = await db.collection('membership_temp.files').find({ 'metadata.membershipId': membershipId }).toArray();

            for (const file of tempFiles) {
                const readStream = tempBucket.openDownloadStream(file._id);
                const uploadStream = validBucket.openUploadStream(file.filename, {
                    metadata: { ...file.metadata, status: 'valid' },
                });

                await new Promise<void>((resolve, reject) => {
                    readStream.pipe(uploadStream).on('error', reject).on('finish', resolve);
                });

                await tempBucket.delete(file._id);
            }

            return { success: true };
        } catch (error: any) {
            console.error('❌ Erreur moveTempToValid:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteTempFiles(membershipId: string): Promise<void> {
        const db = await this.connectIfNeeded();
        const bucket = await this.getBucket('membership_temp');
        const files = await db.collection('membership_temp.files').find({ 'metadata.membershipId': membershipId }).toArray();

        for (const file of files) {
            try {
                await bucket.delete(file._id);
            } catch (e) {
                console.warn(`⚠️ Erreur suppression fichier temporaire ${file._id}`, e);
            }
        }
    }

    async getDocumentsForMembership(membershipId: string): Promise<{ filename: string; base64: string; mime: string; title: string }[]> {
        const db = await this.connectIfNeeded();
        const bucket = await this.getBucket('membership_valid');
        const files = await db.collection('membership_valid.files').find({ 'metadata.membershipId': membershipId }).toArray();

        const results = await Promise.all(
            files.map(async (file) => {
                const buffer = await this.streamToBuffer(bucket.openDownloadStream(file._id));
                return {
                    filename: file.filename,
                    base64: buffer.toString('base64'),
                    mime: file.metadata?.mimetype || 'application/octet-stream',
                    title: file.metadata?.field || 'Document',
                };
            }),
        );

        return results;
    }

    async getFileStream(fileId: string): Promise<{ stream: Readable; mime: string }> {
        const db = await this.connectIfNeeded();
        const bucket = await this.getBucket('membership_valid');
        const file = await db.collection('membership_valid.files').findOne({ _id: new ObjectId(fileId) });

        if (!file) throw new Error('Fichier introuvable');

        const stream = bucket.openDownloadStream(file._id);
        const mime = file.metadata?.mimetype || 'application/octet-stream';
        return { stream, mime };
    }

    private async streamToBuffer(stream: Readable): Promise<Buffer> {
        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
}
