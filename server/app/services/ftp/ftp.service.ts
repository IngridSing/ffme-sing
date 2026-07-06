// import * as ftp from 'basic-ftp';
// import { Buffer } from 'buffer';
// import { unlink } from 'fs/promises';
// import { PassThrough } from 'stream';
// import { Service } from 'typedi';

// @Service()
// export class FtpUploadService {
//     private readonly host = process.env.FTP_HOST!;
//     private readonly user = process.env.FTP_USER!;
//     private readonly password = process.env.FTP_PASSWORD!;
//     private readonly baseRemotePath = '/membership-temp';

//     private async connectClient(): Promise<ftp.Client> {
//         const client = new ftp.Client(60000);
//         client.ftp.verbose = true;

//         await client.access({
//             host: this.host,
//             user: this.user,
//             password: this.password,
//             secure: false, // ou true si ton FTP est sécurisé
//             secureOptions: { rejectUnauthorized: false }, // utile si certificat autosigné
//         });
//         return client;
//     }

//     async getDocumentsForMembership(membershipId: string): Promise<{ filename: string; base64: string; mime: string; title: string }[]> {
//         const client = await this.connectClient();
//         const basePath = `/membership-valid/${membershipId}`;

//         try {
//             const typeFolders = await client.list(basePath);
//             const results: { filename: string; base64: string; mime: string; title: string }[] = [];

//             for (const folder of typeFolders) {
//                 if (folder.type !== ftp.FileType.Directory) continue;

//                 const typeKey = folder.name;
//                 const fullPath = `${basePath}/${typeKey}`;
//                 const files = await client.list(fullPath);

//                 for (const file of files) {
//                     if (file.type !== ftp.FileType.File) continue;

//                     const filePath = `${fullPath}/${file.name}`;
//                     const chunks: Buffer[] = [];

//                     const stream = new PassThrough();
//                     const streamPromise = new Promise<Buffer>((resolve, reject) => {
//                         stream.on('data', (chunk) => chunks.push(chunk));
//                         stream.on('end', () => resolve(Buffer.concat(chunks)));
//                         stream.on('error', (err) => reject(err));
//                     });

//                     await client.downloadTo(stream, filePath);
//                     const buffer = await streamPromise;

//                     const ext = file.name.split('.').pop()?.toLowerCase() || '';
//                     const mime =
//                         ext === 'pdf'
//                             ? 'application/pdf'
//                             : ext === 'png'
//                               ? 'image/png'
//                               : ext === 'jpg' || ext === 'jpeg'
//                                 ? 'image/jpeg'
//                                 : ext === 'doc' || ext === 'docx'
//                                   ? 'application/msword'
//                                   : 'application/octet-stream';

//                     results.push({
//                         filename: file.name,
//                         base64: buffer.toString('base64'),
//                         mime,
//                         title: this.getDocumentLabel(typeKey),
//                     });
//                 }
//             }

//             await client.close();
//             return results;
//         } catch (err) {
//             await client.close();
//             console.error('❌ Erreur lecture documents FTP :', err);
//             return [];
//         }
//     }

//     async uploadFilesToMembershipFolder(
//         membershipId: string,
//         files: { [fieldName: string]: { path: string; originalname: string } },
//     ): Promise<{ success: boolean; paths?: { [key: string]: string }; error?: string }> {
//         try {
//             const client = await this.connectClient();
//             const folderPath = `${this.baseRemotePath}/${membershipId}`;
//             await client.ensureDir(folderPath);

//             const uploadedPaths: { [key: string]: string } = {};

//             for (const [key, file] of Object.entries(files)) {
//                 const remotePath = `${this.baseRemotePath}/${membershipId}/${key}/${file.originalname}`;
//                 await client.ensureDir(`${this.baseRemotePath}/${membershipId}/${key}`);
//                 await client.uploadFrom(file.path, remotePath);
//                 uploadedPaths[key] = remotePath;
//             }

//             for (const file of Object.values(files)) {
//                 try {
//                     await unlink(file.path);
//                 } catch (e) {
//                     console.warn(`⚠️ Impossible de supprimer ${file.path}`, e);
//                 }
//             }

//             await client.close();
//             return { success: true, paths: uploadedPaths };
//         } catch (error: any) {
//             console.error('Erreur FTP :', error.message);
//             return { success: false, error: error.message };
//         }
//     }

//     async moveMembershipFolderToValid(membershipId: string): Promise<{ success: boolean; error?: string }> {
//         const client = await this.connectClient();
//         const tempFolder = `${this.baseRemotePath}/${membershipId}`;
//         const finalFolder = `/membership-valid/${membershipId}`;

//         try {
//             await client.ensureDir(finalFolder);
//             await client.cd(tempFolder);
//             const subdirs = await client.list();

//             for (const subdir of subdirs) {
//                 if (subdir.type === ftp.FileType.Directory) {
//                     const subFolderName = subdir.name;
//                     const sourceSubFolder = `${tempFolder}/${subFolderName}`;
//                     const destSubFolder = `${finalFolder}/${subFolderName}`;

//                     await client.ensureDir(destSubFolder);
//                     await client.cd(sourceSubFolder);

//                     const files = await client.list();
//                     for (const file of files) {
//                         if (file.type === ftp.FileType.File) {
//                             const srcFile = `${sourceSubFolder}/${file.name}`;
//                             const destFile = `${destSubFolder}/${file.name}`;
//                             await client.rename(srcFile, destFile);
//                         }
//                     }
//                 }
//             }

//             // Supprimer le dossier temporaire après déplacement
//             await client.removeDir(tempFolder);
//             await client.close();

//             return { success: true };
//         } catch (err: any) {
//             await client.close();
//             return { success: false, error: err.message };
//         }
//     }

//     async listDocumentPreviewLinksForMembership(
//         membershipId: string,
//     ): Promise<{ filename: string; mime: string; title: string; typeKey: string; previewUrl: string }[]> {
//         const client = await this.connectClient();
//         const basePath = `/membership-valid/${membershipId}`;

//         try {
//             const typeFolders = await client.list(basePath);

//             const results: {
//                 filename: string;
//                 mime: string;
//                 title: string;
//                 typeKey: string;
//                 previewUrl: string;
//             }[] = [];

//             for (const folder of typeFolders) {
//                 // Optionnel : si tu veux tester sans filtrer les types
//                 // if (!folder.name || folder.name.startsWith('.')) continue;

//                 const typeKey = folder.name;
//                 const fullPath = `${basePath}/${typeKey}`;

//                 let files: ftp.FileInfo[];
//                 try {
//                     files = await client.list(fullPath);
//                 } catch (e) {
//                     console.warn(`⚠️ Impossible de lire le contenu du dossier ${fullPath}`, e);
//                     continue;
//                 }

//                 for (const file of files) {
//                     if (file.type !== ftp.FileType.File) continue;

//                     const filename = file.name;
//                     const ext = filename.split('.').pop()?.toLowerCase() || '';
//                     const mime =
//                         ext === 'pdf'
//                             ? 'application/pdf'
//                             : ext === 'png'
//                               ? 'image/png'
//                               : ext === 'jpg' || ext === 'jpeg'
//                                 ? 'image/jpeg'
//                                 : ext === 'doc' || ext === 'docx'
//                                   ? 'application/msword'
//                                   : 'application/octet-stream';

//                     const previewUrl = `/api/admin/member/${membershipId}/documents/${typeKey}/${encodeURIComponent(filename)}`;

//                     results.push({
//                         filename,
//                         mime,
//                         title: this.getDocumentLabel(typeKey),
//                         typeKey,
//                         previewUrl,
//                     });
//                 }
//             }

//             await client.close();
//             console.log(`✅ Total documents trouvés pour ${membershipId} : ${results.length}`);
//             return results;
//         } catch (err) {
//             await client.close();
//             console.error('❌ Erreur lecture documents FTP :', err);
//             return [];
//         }
//     }

//     async deleteMembershipFolder(membershipId: string): Promise<void> {
//         const client = await this.connectClient();
//         const folderPath = `${this.baseRemotePath}/${membershipId}`;
//         await client.removeDir(folderPath);
//         await client.close();
//     }

//     async getDocumentStream(membershipId: string, folder: string, filename: string): Promise<{ buffer: Buffer; mime: string }> {
//         const client = await this.connectClient();
//         const ftpPath = `/membership-valid/${membershipId}/${folder}/${filename}`.normalize('NFC');
//         console.log('➡ Chemin FTP demandé :', ftpPath);

//         const chunks: Buffer[] = [];

//         const stream = new PassThrough();
//         const streamPromise = new Promise<Buffer>((resolve, reject) => {
//             stream.on('data', (chunk) => chunks.push(chunk));
//             stream.on('end', () => resolve(Buffer.concat(chunks)));
//             stream.on('error', reject);
//         });

//         await client.downloadTo(stream, ftpPath);
//         const buffer = await streamPromise;
//         await client.close();

//         const ext = filename.split('.').pop()?.toLowerCase() || '';
//         const mime =
//             ext === 'pdf'
//                 ? 'application/pdf'
//                 : ext === 'png'
//                   ? 'image/png'
//                   : ext === 'jpg' || ext === 'jpeg'
//                     ? 'image/jpeg'
//                     : ext === 'doc' || ext === 'docx'
//                       ? 'application/msword'
//                       : 'application/octet-stream';

//         return { buffer, mime };
//     }

//     private getDocumentLabel(key: string): string {
//         switch (key.toLowerCase()) {
//             case 'cv':
//                 return 'CV';
//             case 'photo':
//                 return 'Photo';
//             case 'id':
//                 return 'Pièce d’identité';
//             case 'formulaire':
//                 return 'Formulaire d’adhésion';
//             default:
//                 return 'Document';
//         }
//     }
// }
