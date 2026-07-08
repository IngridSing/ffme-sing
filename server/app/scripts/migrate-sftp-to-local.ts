/**
 * Migration one-shot : copie les images depuis un ancien serveur SFTP vers uploads/.
 * Non utilisé au runtime — l'application écrit directement dans UPLOADS_DIR.
 *
 * Usage (depuis server/) :
 *   FTP_HOST=... FTP_USER=... FTP_PASSWORD=... UPLOADS_DIR=./uploads pnpm ts-node app/scripts/migrate-sftp-to-local.ts
 */
import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import SFTP from 'ssh2-sftp-client';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const REMOTE_DIRS = ['galleryImages', 'newsImages', 'productImages'];

type SftpClient = InstanceType<typeof SFTP>;

async function listDirectoryRecursive(sftp: SftpClient, dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
        const items = await sftp.list(dirPath);

        for (const item of items) {
            const fullPath = `${dirPath}/${item.name}`;
            if (item.type === 'd') {
                files.push(...(await listDirectoryRecursive(sftp, fullPath)));
            } else if (item.type === '-') {
                files.push(fullPath);
            }
        }
    } catch (err) {
        console.warn(`⚠️  Impossible de lister ${dirPath}:`, (err as Error).message);
    }

    return files;
}

async function migrate(): Promise<void> {
    const sftp = new SFTP();

    console.log('🔄 Migration SFTP → stockage local');
    console.log(`   Destination: ${UPLOADS_DIR}`);

    await sftp.connect({
        host: process.env.FTP_HOST,
        port: Number(process.env.FTP_PORT) || 22,
        username: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        readyTimeout: 60000,
        hostVerifier: () => true,
    });

    let total = 0;
    let success = 0;

    for (const dir of REMOTE_DIRS) {
        const remoteFiles = await listDirectoryRecursive(sftp, dir);
        console.log(`📁 ${dir}: ${remoteFiles.length} fichier(s)`);
        total += remoteFiles.length;

        for (const remotePath of remoteFiles) {
            try {
                const localPath = path.join(UPLOADS_DIR, remotePath);
                await fs.mkdir(path.dirname(localPath), { recursive: true });

                const buffer = await sftp.get(remotePath);
                await fs.writeFile(localPath, buffer);
                success++;
                console.log(`   ✅ ${remotePath}`);
            } catch (err) {
                console.error(`   ❌ ${remotePath}:`, (err as Error).message);
            }
        }
    }

    await sftp.end();
    console.log(`\n✅ Migration terminee: ${success}/${total} fichiers copies`);
}

migrate().catch((err) => {
    console.error('❌ Erreur migration:', err);
    process.exit(1);
});
