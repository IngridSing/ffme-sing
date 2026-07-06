import { authenticateToken } from '@app/middlewares/auth.middleware';
import { VideoDatabaseService } from '@app/services/database/video/video.database.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class AdminVideoController {
    public router: Router;

    constructor(private readonly videoDbService: VideoDatabaseService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        /**
         * @swagger
         * tags:
         *   - name: Admin - Video
         *     description: Gestion des vidéos (admin)
         */

        /**
         * @swagger
         * /api/admin/video:
         *   get:
         *     summary: Récupérer toutes les vidéos (actives et inactives)
         *     tags: [Admin - Video]
         *     responses:
         *       200:
         *         description: Liste des vidéos
         */
        this.router.get('/', async (_req: Request, res: Response) => {
            try {
                const videoList = await this.videoDbService.getAll(true);
                return res.status(StatusCodes.OK).json(videoList);
            } catch (err) {
                console.error('Erreur chargement vidéos admin:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/admin/video/{id}:
         *   get:
         *     summary: Récupérer une vidéo par son ID
         *     tags: [Admin - Video]
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

        /**
         * @swagger
         * /api/admin/video:
         *   post:
         *     summary: Créer une nouvelle vidéo
         *     tags: [Admin - Video]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - title
         *               - description
         *               - videoUrl
         *               - date
         *             properties:
         *               title:
         *                 type: string
         *               description:
         *                 type: string
         *               videoUrl:
         *                 type: string
         *               date:
         *                 type: string
         *     responses:
         *       201:
         *         description: Vidéo créée
         *       400:
         *         description: Champs requis manquants
         */
        this.router.post('/', authenticateToken, async (req: Request, res: Response) => {
            const { title, description, videoUrl, date } = req.body;

            if (!title || !description || !videoUrl || !date) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Champs requis manquants.' });
            }

            try {
                const saved = await this.videoDbService.create({ title, description, videoUrl, date });
                return res.status(StatusCodes.CREATED).json(saved);
            } catch (err) {
                console.error('[POST] Erreur création vidéo:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/video/{id}:
         *   put:
         *     summary: Modifier une vidéo
         *     tags: [Admin - Video]
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
         *               videoUrl:
         *                 type: string
         *               date:
         *                 type: string
         *     responses:
         *       200:
         *         description: Vidéo mise à jour
         *       404:
         *         description: Vidéo non trouvée
         */
        this.router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
            try {
                const updated = await this.videoDbService.update(req.params.id as string, req.body);
                if (!updated) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Vidéo non trouvée.' });
                }
                return res.status(StatusCodes.OK).json(updated);
            } catch (err) {
                console.error('[PUT] Erreur update vidéo:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/video/{id}/toggle:
         *   patch:
         *     summary: Activer/Désactiver une vidéo
         *     tags: [Admin - Video]
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
         *         description: Statut de la vidéo modifié
         *       404:
         *         description: Vidéo non trouvée
         */
        this.router.patch('/:id/toggle', authenticateToken, async (req: Request, res: Response) => {
            try {
                const updated = await this.videoDbService.toggleActive(req.params.id as string);
                if (!updated) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Vidéo non trouvée.' });
                }
                return res.status(StatusCodes.OK).json(updated);
            } catch (err) {
                console.error('[PATCH] Erreur toggle vidéo:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/video/{id}:
         *   delete:
         *     summary: Supprimer une vidéo
         *     tags: [Admin - Video]
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
         *         description: Vidéo supprimée
         *       404:
         *         description: Vidéo non trouvée
         */
        this.router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
            try {
                const deleted = await this.videoDbService.delete(req.params.id as string);
                if (!deleted) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Vidéo non trouvée' });
                }
                return res.status(StatusCodes.OK).json({ success: true, message: 'Vidéo supprimée.' });
            } catch (err) {
                console.error('[DELETE] Erreur suppression vidéo:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });
    }
}
