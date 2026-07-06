import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { Service } from 'typedi';

@Service()
export class ImageCacheService {
    private readonly uploadsDir: string;
    private isInitialized = false;

    constructor() {
        this.uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        await fs.mkdir(path.join(this.uploadsDir, 'galleryImages'), { recursive: true });
        await fs.mkdir(path.join(this.uploadsDir, 'newsImages'), { recursive: true });
        await fs.mkdir(path.join(this.uploadsDir, 'productImages'), { recursive: true });

        console.log(`🖼️  Stockage images local: ${this.uploadsDir}`);
        this.isInitialized = true;
    }

    async getImage(relativePath: string): Promise<{ stream: Readable; mime: string }> {
        await this.initialize();

        const localPath = this.resolvePath(relativePath);
        if (!fsSync.existsSync(localPath)) {
            throw new Error(`Image non trouvee: ${relativePath}`);
        }

        return {
            stream: fsSync.createReadStream(localPath),
            mime: this.getMimeType(relativePath),
        };
    }

    async saveImage(relativePath: string, buffer: Buffer): Promise<void> {
        await this.initialize();

        const localPath = this.resolvePath(relativePath);
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, buffer);
        console.log(`➕ Image sauvegardee: ${relativePath}`);
    }

    async addToCache(relativePath: string, buffer: Buffer): Promise<void> {
        return this.saveImage(relativePath, buffer);
    }

    async removeImage(relativePath: string): Promise<void> {
        const localPath = this.resolvePath(relativePath);
        try {
            await fs.unlink(localPath);
            console.log(`🗑️  Image supprimee: ${relativePath}`);
        } catch {
            // Fichier deja absent
        }
    }

    async removeFromCache(relativePath: string): Promise<void> {
        return this.removeImage(relativePath);
    }

    getStats(): { files: number; size: number; sizeFormatted: string } {
        return { files: 0, size: 0, sizeFormatted: '0 MB' };
    }

    isReady(): boolean {
        return this.isInitialized;
    }

    private resolvePath(relativePath: string): string {
        const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path.resolve(this.uploadsDir, normalized);

        if (!fullPath.startsWith(path.resolve(this.uploadsDir))) {
            throw new Error('Chemin invalide');
        }

        return fullPath;
    }

    private getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.webp': 'image/webp',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
