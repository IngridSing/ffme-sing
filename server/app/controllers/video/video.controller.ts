import { VideoDatabaseService } from '@app/services/database/video/video.database.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class VideoController {
    public router: Router;

    constructor(private readonly videoDbService: VideoDatabaseService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        /**
         * @swagger
         * tags:
         *   - name: Video
         *     description: Vidéos publiques
         */

        /**
         * @swagger
         * /api/video:
         *   get:
         *     summary: Récupérer toutes les vidéos actives
         *     tags: [Video]
         *     responses:
         *       200:
         *         description: Liste des vidéos
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/', async (_req: Request, res: Response) => {
            try {
                const videoList = await this.videoDbService.getAll(false);
                return res.status(StatusCodes.OK).json(videoList);
            } catch (err) {
                console.error('Erreur chargement vidéos:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/video/{id}:
         *   get:
         *     summary: Récupérer une vidéo par son ID
         *     tags: [Video]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Détails de la vidéo
         *       404:
         *         description: Vidéo introuvable
         */
        this.router.get('/:id', async (req: Request, res: Response) => {
            try {
                const video = await this.videoDbService.getById(req.params.id as string);
                if (!video) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Vidéo introuvable' });
                }
                return res.status(StatusCodes.OK).json(video);
            } catch (err) {
                console.error('Erreur récupération vidéo:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });
    }
}
