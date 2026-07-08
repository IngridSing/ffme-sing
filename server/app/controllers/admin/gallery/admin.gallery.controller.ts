import { authenticateToken } from '@app/middlewares/auth.middleware';
import { connectionLimiter } from '@app/middlewares/connectionLimiter.middleware';
import { imageRateLimiter } from '@app/middlewares/imageRateLimiter.middleware';
import { GalleryStorageService } from '@app/services/database/gallery/gallery.storage.service';
import { streamImageResponse } from '@app/utils/image-route.util';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import { Service } from 'typedi';

@Service()
export class AdminGalleryController {
    public router: Router;

    constructor(private readonly galleryDbService: GalleryStorageService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        // Configuration multer avec limite de taille (100 Mo par fichier)
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 100 * 1024 * 1024, // 100 Mo max par fichier
                files: 20, // Maximum 20 fichiers
            },
        });

        /**
         * @swagger
         * tags:
         *   - name: Admin - Gallery
         *     description: Gestion de la galerie photo (admin)
         */

        /**
         * @swagger
         * /api/admin/gallery:
         *   get:
         *     summary: Récupérer toutes les photos
         *     tags: [Admin - Gallery]
         *     responses:
         *       200:
         *         description: Liste des photos
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const photos = await this.galleryDbService.getAll();
                return res.status(StatusCodes.OK).json(photos);
            } catch (err) {
                console.error('[GET] Erreur chargement galerie:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/gallery/image/{filename}:
         *   get:
         *     summary: Récupérer une image de la galerie
         *     tags: [Admin - Gallery]
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
         * /api/admin/gallery/{id}:
         *   get:
         *     summary: Récupérer une photo par son ID
         *     tags: [Admin - Gallery]
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
            const id = req.params.id as string;
            const photo = await this.galleryDbService.getById(id);
            if (!photo) {
                return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Photo introuvable' });
            }
            return res.status(StatusCodes.OK).json(photo);
        });

        /**
         * @swagger
         * /api/admin/gallery:
         *   post:
         *     summary: Uploader de nouvelles photos
         *     tags: [Admin - Gallery]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               eventName:
         *                 type: string
         *               description:
         *                 type: string
         *               images:
         *                 type: array
         *                 items:
         *                   type: string
         *                   format: binary
         *     responses:
         *       201:
         *         description: Photos uploadées
         *       400:
         *         description: Champs requis manquants
         */
        this.router.post('/', upload.array('images', 20), authenticateToken, async (req: Request, res: Response) => {
            const { eventName, description } = req.body;
            const files = req.files as Express.Multer.File[];

            console.log(`[POST /gallery] Debut upload: ${files?.length || 0} fichiers pour "${eventName}"`);

            if (!files || files.length === 0 || !eventName || !description) {
                return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Champs requis manquants.' });
            }

            try {
                const savedPhotos = await this.galleryDbService.uploadPhotos(files, eventName, description);
                console.log(`[POST /gallery] Upload termine: ${savedPhotos.length} photos sauvegardees`);
                return res.status(StatusCodes.CREATED).json(savedPhotos);
            } catch (err) {
                console.error('[POST /gallery] Erreur upload:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Erreur serveur: ${(err as Error).message}` });
            }
        });

        /**
         * @swagger
         * /api/admin/gallery/{id}:
         *   put:
         *     summary: Modifier une photo
         *     tags: [Admin - Gallery]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               eventName:
         *                 type: string
         *               description:
         *                 type: string
         *     responses:
         *       200:
         *         description: Photo mise à jour
         *       404:
         *         description: Photo non trouvée
         */
        this.router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
            const id = req.params.id as string;
            const { eventName, description } = req.body;

            if (!eventName || !description) {
                return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Champs requis manquants.' });
            }

            try {
                const updated = await this.galleryDbService.updatePhoto(id, eventName, description);
                if (!updated) {
                    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Photo non trouvée.' });
                }
                return res.status(StatusCodes.OK).json(updated);
            } catch (err) {
                console.error('❌ [PUT] Erreur modification photo :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/gallery/{id}:
         *   delete:
         *     summary: Supprimer une photo
         *     tags: [Admin - Gallery]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Photo supprimée
         *       404:
         *         description: Photo introuvable
         */
        this.router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
            const id = req.params.id as string;

            try {
                const deleted = await this.galleryDbService.deletePhoto(id);
                if (!deleted) {
                    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Photo introuvable' });
                }
                return res.status(StatusCodes.OK).json({ success: true, message: 'Photo supprimée avec succès' });
            } catch (err) {
                console.error('❌ [DELETE] Erreur suppression photo :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/admin/gallery/event/{eventName}:
         *   delete:
         *     summary: Supprimer un evenement et toutes ses photos
         *     tags: [Admin - Gallery]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: eventName
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Evenement supprime
         *       500:
         *         description: Erreur serveur
         */
        this.router.delete('/event/:eventName', authenticateToken, async (req: Request, res: Response) => {
            const eventName = decodeURIComponent(req.params.eventName as string);

            console.log(`[DELETE /gallery/event] Suppression de l'evenement: "${eventName}"`);

            try {
                const result = await this.galleryDbService.deleteEvent(eventName);
                if (result.success) {
                    console.log(`[DELETE /gallery/event] ${result.deletedCount} photos supprimees`);
                    return res.status(StatusCodes.OK).json({
                        success: true,
                        message: `Evenement "${eventName}" supprime avec ${result.deletedCount} photo(s)`,
                        deletedCount: result.deletedCount,
                    });
                }
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur lors de la suppression' });
            } catch (err) {
                console.error('[DELETE /gallery/event] Erreur:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur' });
            }
        });
    }
}
