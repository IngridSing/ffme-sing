import { authenticateToken } from '@app/middlewares/auth.middleware';
import { connectionLimiter } from '@app/middlewares/connectionLimiter.middleware';
import { imageRateLimiter } from '@app/middlewares/imageRateLimiter.middleware';
import { NewsStorageService } from '@app/services/database/news/news.storage.service';
import { streamImageResponse } from '@app/utils/image-route.util';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import { Service } from 'typedi';

@Service()
export class AdminNewsController {
    public router: Router;

    constructor(private readonly newsDbService: NewsStorageService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        // Configuration multer avec limite de taille (100 Mo par fichier)
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 100 * 1024 * 1024, // 100 Mo max par fichier
            },
        });

        /**
         * @swagger
         * tags:
         *   - name: Admin - News
         *     description: Gestion des actualités (admin)
         */

        /**
         * @swagger
         * /api/admin/news:
         *   get:
         *     summary: Récupérer toutes les actualités
         *     tags: [Admin - News]
         *     responses:
         *       200:
         *         description: Liste des actualités
         */
        this.router.get('/', async (_req: Request, res: Response) => {
            const newsList = await this.newsDbService.getAll();
            return res.status(StatusCodes.OK).json(newsList);
        });

        /**
         * @swagger
         * /api/admin/news/image/{filename}:
         *   get:
         *     summary: Récupérer l'image d'une actualité
         *     tags: [Admin - News]
         *     parameters:
         *       - in: path
         *         name: filename
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Image de l'actualité
         *         content:
         *           image/*:
         *             schema:
         *               type: string
         *               format: binary
         *       500:
         *         description: Erreur lors de l'affichage de l'image
         */
        this.router.get('/image/*splat', imageRateLimiter, connectionLimiter, async (req: Request, res: Response) => {
            await streamImageResponse(req, res, (filename) => this.newsDbService.streamImage(filename), 'Erreur affichage image.');
        });

        /**
         * @swagger
         * /api/admin/news/{id}:
         *   get:
         *     summary: Récupérer une actualité par son ID
         *     tags: [Admin - News]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Détails de l'actualité
         *       404:
         *         description: Actualité introuvable
         */
        this.router.get('/:id', async (req: Request, res: Response) => {
            const news = await this.newsDbService.getById(req.params.id as string);
            if (!news) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: 'Actualité introuvable' });
            }
            return res.status(StatusCodes.OK).json(news);
        });

        /**
         * @swagger
         * /api/admin/news:
         *   post:
         *     summary: Créer une nouvelle actualité
         *     tags: [Admin - News]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               title:
         *                 type: string
         *               description:
         *                 type: string
         *               date:
         *                 type: string
         *               externalLink:
         *                 type: string
         *               image:
         *                 type: string
         *                 format: binary
         *     responses:
         *       201:
         *         description: Actualité créée
         *       400:
         *         description: Champs requis manquants
         */
        this.router.post('/', upload.single('image'), authenticateToken, async (req: Request, res: Response) => {
            const { title, description, date, externalLink } = req.body;
            const file = req.file;

            if (!file || !title || !description || !date) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Champs requis manquants.' });
            }

            try {
                const saved = await this.newsDbService.uploadNews(file, title, description, date, externalLink);
                return res.status(StatusCodes.CREATED).json(saved);
            } catch (err) {
                console.error('❌ [POST] Erreur upload news :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/news/{id}:
         *   put:
         *     summary: Modifier une actualité
         *     tags: [Admin - News]
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
         *               title:
         *                 type: string
         *               description:
         *                 type: string
         *               date:
         *                 type: string
         *               externalLink:
         *                 type: string
         *     responses:
         *       200:
         *         description: Actualité mise à jour
         *       404:
         *         description: Actualité non trouvée
         */
        this.router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
            const { title, description, date, externalLink } = req.body;
            if (!title || !description || !date) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Champs requis manquants.' });
            }

            try {
                const updated = await this.newsDbService.updateNews(req.params.id as string, title, description, date, externalLink);
                if (!updated) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Actualité non trouvée.' });
                }
                return res.status(StatusCodes.OK).json(updated);
            } catch (err) {
                console.error('❌ [PUT] Erreur update news :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/news/{id}:
         *   delete:
         *     summary: Supprimer une actualité
         *     tags: [Admin - News]
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
         *         description: Actualité supprimée
         *       404:
         *         description: Actualité non trouvée
         */
        this.router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
            try {
                const deleted = await this.newsDbService.deleteNews(req.params.id as string);
                if (!deleted) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Actualité non trouvée' });
                }
                return res.status(StatusCodes.OK).json({ success: true, message: 'Actualité supprimée.' });
            } catch (err) {
                console.error('❌ [DELETE] Erreur suppression news :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });
    }
}
