// controllers/public/news.controller.ts
import { connectionLimiter } from '@app/middlewares/connectionLimiter.middleware';
import { imageRateLimiter } from '@app/middlewares/imageRateLimiter.middleware';
import { NewsDatabaseFtpService } from '@app/services/database/news/news.database.ftp.service';
import { streamImageResponse } from '@app/utils/image-route.util';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class NewsController {
    public router: Router;

    constructor(private readonly newsDbService: NewsDatabaseFtpService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        /**
         * @swagger
         * tags:
         *   - name: News
         *     description: Actualités publiques
         */

        /**
         * @swagger
         * /api/news:
         *   get:
         *     summary: Récupérer les actualités (paginé)
         *     tags: [News]
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
         *     responses:
         *       200:
         *         description: Liste paginée des actualités
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
                const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 6));
                const newsList = await this.newsDbService.getPaginated(page, limit);
                return res.status(StatusCodes.OK).json(newsList);
            } catch (err) {
                console.error('❌ Erreur chargement actualités:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/news/image/{filename}:
         *   get:
         *     summary: Récupérer l'image d'une actualité
         *     tags: [News]
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
         * /api/news/{id}:
         *   get:
         *     summary: Récupérer une actualité par son ID
         *     tags: [News]
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
            try {
                const news = await this.newsDbService.getById(req.params.id as string);
                if (!news) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Actualité introuvable' });
                }
                return res.status(StatusCodes.OK).json(news);
            } catch (err) {
                console.error('❌ Erreur récupération actualité:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });
    }
}
