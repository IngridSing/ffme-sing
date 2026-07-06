import { Request, Response } from 'express';
import { Readable } from 'stream';

export function extractImagePath(req: Request): string {
    const splat = req.params.splat;
    const rawPath = Array.isArray(splat) ? splat.join('/') : (splat ?? '');
    return decodeURIComponent(rawPath);
}

export async function streamImageResponse(
    req: Request,
    res: Response,
    streamImage: (filename: string) => Promise<{ stream: Readable; mime: string }>,
    errorMessage = "Erreur lors de l'affichage de l'image.",
): Promise<void> {
    const filename = extractImagePath(req);

    try {
        const { stream, mime } = await streamImage(filename);
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        stream.pipe(res);
    } catch (err) {
        console.error(`❌ Erreur streaming image (${filename}):`, err);
        res.status(500).json({ message: errorMessage });
    }
}
