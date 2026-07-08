// src/app/controllers/gallery.controller.ts
import { connectionLimiter } from '@app/middlewares/connectionLimiter.middleware';
import { imageRateLimiter } from '@app/middlewares/imageRateLimiter.middleware';
import { GalleryStorageService } from '@app/services/database/gallery/gallery.storage.service';
import { streamImageResponse } from '@app/utils/image-route.util';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class GalleryController {
    router: Router;

    constructor(private readonly galleryDbService: GalleryStorageService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        /**
         * @swagger
         * tags:
         *   - name: Gallery
         *     description: Galerie photo publique
         */

        /**
         * @swagger
         * /api/gallery/meta:
         *   get:
         *     summary: Métadonnées de la galerie (événements et totaux)
         *     tags: [Gallery]
         *     responses:
         *       200:
         *         description: Métadonnées de la galerie
         */
        this.router.get('/meta', async (_req: Request, res: Response) => {
            try {
                const meta = await this.galleryDbService.getMeta();
                return res.status(StatusCodes.OK).json(meta);
            } catch (err) {
                console.error('❌ Erreur chargement meta galerie:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/gallery:
         *   get:
         *     summary: Récupérer les photos de la galerie (paginé)
         *     tags: [Gallery]
         *     parameters:
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           default: 1
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 6
         *       - in: query
         *         name: eventName
         *         schema:
         *           type: string
         *       - in: query
         *         name: search
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Liste paginée des photos
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
                const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 6));
                const eventName = (req.query.eventName as string) || undefined;
                const search = (req.query.search as string) || undefined;

                const photos = await this.galleryDbService.getPaginated(page, limit, { eventName, search });
                return res.status(StatusCodes.OK).json(photos);
            } catch (err) {
                console.error('❌ Erreur chargement galerie:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/gallery/event/{eventName}:
         *   get:
         *     summary: Récupérer les photos d'un événement
         *     tags: [Gallery]
         *     parameters:
         *       - in: path
         *         name: eventName
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Liste des photos de l'événement
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/event/:eventName', async (req: Request, res: Response) => {
            try {
                const eventName = req.params.eventName as string;
                const photos = await this.galleryDbService.getByEvent(eventName);
                return res.status(StatusCodes.OK).json(photos);
            } catch (err) {
                console.error('❌ Erreur chargement événement:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/gallery/image/{filename}:
         *   get:
         *     summary: Récupérer une image de la galerie
         *     tags: [Gallery]
         *     parameters:
         *       - in: path
         *         name: filename
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Image retournée
         *         content:
         *           image/*:
         *             schema:
         *               type: string
         *               format: binary
         *       500:
         *         description: Erreur lors de l'affichage de l'image
         */
        this.router.get('/image/*splat', imageRateLimiter, connectionLimiter, async (req: Request, res: Response) => {
            await streamImageResponse(req, res, (filename) => this.galleryDbService.streamImage(filename));
        });

        /**
         * @swagger
         * /api/gallery/{id}:
         *   get:
         *     summary: Récupérer une photo par son ID
         *     tags: [Gallery]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Détails de la photo
         *       404:
         *         description: Photo introuvable
         */
        this.router.get('/:id', async (req: Request, res: Response) => {
            try {
                const id = req.params.id as string;
                const photo = await this.galleryDbService.getById(id);
                if (!photo) {
                    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Photo introuvable' });
                }
                return res.status(StatusCodes.OK).json(photo);
            } catch (err) {
                console.error('❌ Erreur récupération photo:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });
    }
}
