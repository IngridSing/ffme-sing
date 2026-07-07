/**
 * Copie les photos UBA du backup (ancien dossier + anciens UUID)
 * vers les chemins attendus par MongoDB (nouveau dossier + nouveaux UUID).
 *
 * Usage (depuis server/) :
 *   UPLOADS_DIR=/app/uploads MONGO_URI=... pnpm ts-node -r tsconfig-paths/register app/scripts/remap-uba-backup-files.ts
 */
import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import mongoose from 'mongoose';
import { GalleryPhotoModel } from '../models/gallery-photo.model';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

const MONGO_EVENT = 'Cérémonie de remise de dons de la Fondation UBA';

async function findBackupFolder(): Promise<string> {
    const galleryRoot = path.join(UPLOADS_DIR, 'galleryImages');
    const entries = await fs.readdir(galleryRoot, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.toLowerCase().includes('uba')) continue;
        if (entry.name.includes('remise de dons')) continue; // dossier Mongo cible, pas la source

        const dir = path.join(galleryRoot, entry.name);
        const files = await fs.readdir(dir);
        const webp = files.filter((f) => f.endsWith('.webp'));
        if (webp.length > 0) return entry.name;
    }

    throw new Error('Dossier UBA (backup) introuvable dans uploads/galleryImages');
}

async function main(): Promise<void> {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI requis');

    await mongoose.connect(uri);

    const backupFolder = await findBackupFolder();
    const backupDir = path.join(UPLOADS_DIR, 'galleryImages', backupFolder);
    const backupFiles = (await fs.readdir(backupDir))
        .filter((f) => f.endsWith('.webp'))
        .sort();

    const photos = await GalleryPhotoModel.find({ eventName: MONGO_EVENT }).sort({ date: 1 }).lean();

    console.log(`📁 Backup: ${backupFolder} (${backupFiles.length} fichiers)`);
    console.log(`🗄️  MongoDB: ${MONGO_EVENT} (${photos.length} entrées)`);

    if (backupFiles.length !== photos.length) {
        console.warn(
            `⚠️  Nombre différent (${backupFiles.length} vs ${photos.length}) — appariement partiel`,
        );
    }

    const count = Math.min(backupFiles.length, photos.length);
    let copied = 0;

    for (let i = 0; i < count; i++) {
        const src = path.join(backupDir, backupFiles[i]);
        const dest = path.join(UPLOADS_DIR, photos[i].image);

        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
        copied++;
        console.log(`  ✓ ${photos[i].image}`);
    }

    console.log(`\n✅ ${copied} image(s) UBA copiée(s) vers les chemins MongoDB`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('❌', err);
    process.exit(1);
});
