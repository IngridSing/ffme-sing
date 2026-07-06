import { authenticateToken } from '@app/middlewares/auth.middleware';
import { connectionLimiter } from '@app/middlewares/connectionLimiter.middleware';
import { imageRateLimiter } from '@app/middlewares/imageRateLimiter.middleware';
import { ProductDatabaseService } from '@app/services/database/product/product.database.service';
import { streamImageResponse } from '@app/utils/image-route.util';
import { Product } from '@common/interfaces/product';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import { Service } from 'typedi';

function safeJsonParse<T>(jsonString: string, fallback: T): T {
    try {
        return JSON.parse(jsonString) as T;
    } catch {
        return fallback;
    }
}

@Service()
export class AdminProductController {
    public router: Router;

    constructor(private readonly productDbService: ProductDatabaseService) {
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
         *   - name: Admin - Products
         *     description: Gestion des produits (admin)
         *   - name: Admin - Orders
         *     description: Gestion des commandes (admin)
         */

        /**
         * @swagger
         * /api/admin/product/orders:
         *   get:
         *     summary: Récupérer toutes les commandes
         *     tags: [Admin - Orders]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Liste des commandes
         */
        this.router.get('/orders', authenticateToken, async (_req: Request, res: Response) => {
            const orders = await this.productDbService.getAllOrders();
            return res.status(StatusCodes.OK).json(orders);
        });

        /**
         * @swagger
         * /api/admin/product/order/{id}:
         *   get:
         *     summary: Récupérer une commande par son ID
         *     tags: [Admin - Orders]
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
         *         description: Détails de la commande
         *       404:
         *         description: Commande introuvable
         */
        this.router.get('/order/:id', authenticateToken, async (req: Request, res: Response) => {
            const order = await this.productDbService.getOrderById(req.params.id as string);
            if (!order) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: 'Commande introuvable' });
            }
            return res.status(StatusCodes.OK).json(order);
        });

        /**
         * @swagger
         * /api/admin/product/order/{id}/status:
         *   patch:
         *     summary: Modifier le statut d'une commande
         *     tags: [Admin - Orders]
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
         *               newStatus:
         *                 type: string
         *     responses:
         *       200:
         *         description: Statut mis à jour
         *       404:
         *         description: Commande introuvable
         */
        this.router.patch('/order/:id/status', authenticateToken, async (req: Request, res: Response) => {
            const { newStatus } = req.body;

            try {
                const updated = await this.productDbService.updateOrderStatus(req.params.id as string, newStatus);
                if (!updated) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Commande introuvable' });
                }
                return res.status(StatusCodes.OK).json(updated);
            } catch (err) {
                console.error('❌ [PATCH] Erreur update statut commande :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/product:
         *   get:
         *     summary: Récupérer tous les produits
         *     tags: [Admin - Products]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Liste des produits
         */
        this.router.get('/', authenticateToken, async (_req: Request, res: Response) => {
            const products = await this.productDbService.getAllProducts();
            return res.status(StatusCodes.OK).json(products);
        });

        /**
         * @swagger
         * /api/admin/product/image/{filename}:
         *   get:
         *     summary: Récupérer l'image d'un produit
         *     tags: [Admin - Products]
         *     parameters:
         *       - in: path
         *         name: filename
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Image du produit
         *         content:
         *           image/*:
         *             schema:
         *               type: string
         *               format: binary
         *       500:
         *         description: Erreur lors de l'affichage de l'image
         */
        this.router.get('/image/*splat', imageRateLimiter, connectionLimiter, async (req: Request, res: Response) => {
            await streamImageResponse(req, res, (filename) => this.productDbService.streamImage(filename), 'Erreur affichage image.');
        });

        /**
         * @swagger
         * /api/admin/product/{id}:
         *   get:
         *     summary: Récupérer un produit par son ID
         *     tags: [Admin - Products]
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
         *         description: Détails du produit
         *       404:
         *         description: Produit introuvable
         */
        this.router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
            const product = await this.productDbService.getProductById(req.params.id as string);
            if (!product) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: 'Produit introuvable' });
            }
            return res.status(StatusCodes.OK).json(product);
        });

        /**
         * @swagger
         * /api/admin/product:
         *   post:
         *     summary: Créer un nouveau produit
         *     tags: [Admin - Products]
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
         *               about:
         *                 type: string
         *               type:
         *                 type: string
         *               stock:
         *                 type: number
         *               versions:
         *                 type: string
         *               extraLink:
         *                 type: string
         *               image:
         *                 type: string
         *                 format: binary
         *     responses:
         *       201:
         *         description: Produit créé
         *       400:
         *         description: Champs requis manquants
         */
        this.router.post('/', upload.single('image'), authenticateToken, async (req: Request, res: Response) => {
            const { title, description, about, type, stock, versions, extraLink } = req.body;
            const file = req.file;

            if (!file || !title || !description || !about || !type || !versions || !stock) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Champs requis manquants.' });
            }

            try {
                const parsedAbout = safeJsonParse<string[]>(about, []);
                const parsedVersions = safeJsonParse<any[]>(versions, []);
                const parsedExtraLink = extraLink ? safeJsonParse<{ label: string; url: string }>(extraLink, { label: '', url: '' }) : undefined;

                if (parsedAbout.length === 0 || parsedVersions.length === 0) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Format JSON invalide pour about ou versions.' });
                }

                const productToSave: Product = {
                    title,
                    description,
                    about: parsedAbout,
                    type,
                    stock: Number(stock),
                    versions: parsedVersions,
                    extraLink: parsedExtraLink,
                    image: '',
                    averageReview: 0,
                    comments: [],
                };

                const saved = await this.productDbService.createProduct(file, productToSave);
                return res.status(StatusCodes.CREATED).json(saved);
            } catch (err) {
                console.error('Erreur création produit :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/product/{id}:
         *   put:
         *     summary: Modifier un produit
         *     tags: [Admin - Products]
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
         *         application/x-www-form-urlencoded:
         *           schema:
         *             type: object
         *             properties:
         *               title:
         *                 type: string
         *               description:
         *                 type: string
         *               about:
         *                 type: string
         *               type:
         *                 type: string
         *               stock:
         *                 type: number
         *               versions:
         *                 type: string
         *               extraLink:
         *                 type: string
         *     responses:
         *       200:
         *         description: Produit mis à jour
         *       400:
         *         description: Champs requis manquants
         */
        this.router.put('/:id', upload.none(), authenticateToken, async (req: Request, res: Response) => {
            const { title, description, about, type, stock, versions, extraLink } = req.body;

            if (!title || !description || !about || !type || !versions || !stock) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Champs requis manquants.' });
            }

            try {
                const parsedAbout = safeJsonParse<string[]>(about, []);
                const parsedVersions = safeJsonParse<any[]>(versions, []);
                const parsedExtraLink = extraLink ? safeJsonParse<{ label: string; url: string }>(extraLink, { label: '', url: '' }) : undefined;

                if (parsedAbout.length === 0 || parsedVersions.length === 0) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Format JSON invalide pour about ou versions.' });
                }

                const updated = await this.productDbService.updateProduct(req.params.id as string, {
                    title,
                    description,
                    about: parsedAbout,
                    type,
                    stock: Number(stock),
                    versions: parsedVersions,
                    extraLink: parsedExtraLink,
                });

                return res.status(StatusCodes.OK).json(updated);
            } catch (err) {
                console.error('Erreur update produit :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/product/{id}:
         *   delete:
         *     summary: Supprimer un produit
         *     tags: [Admin - Products]
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
         *         description: Produit supprimé
         *       404:
         *         description: Produit non trouvé
         */
        this.router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
            try {
                const deleted = await this.productDbService.deleteProduct(req.params.id as string);
                if (!deleted) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Produit non trouvé' });
                }
                return res.status(StatusCodes.OK).json({ success: true, message: 'Produit supprimé.' });
            } catch (err) {
                console.error('❌ [DELETE] Erreur suppression produit :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });

        /**
         * @swagger
         * /api/admin/product/{productId}/comment/{commentId}:
         *   patch:
         *     summary: Valider ou supprimer un commentaire
         *     tags: [Admin - Products]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: productId
         *         required: true
         *         schema:
         *           type: string
         *       - in: path
         *         name: commentId
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
         *               action:
         *                 type: string
         *                 enum: [validate, delete]
         *     responses:
         *       200:
         *         description: Commentaire mis à jour
         *       400:
         *         description: Action invalide
         */
        this.router.patch('/:productId/comment/:commentId', authenticateToken, async (req: Request, res: Response) => {
            const { action } = req.body;
            if (!['validate', 'delete'].includes(action)) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Action invalide.' });
            }

            try {
                const updated = await this.productDbService.patchProductComment(req.params.productId as string, req.params.commentId as string, action);
                return res.status(StatusCodes.OK).json(updated);
            } catch (err) {
                console.error('❌ [PATCH] Erreur patch commentaire produit :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur.' });
            }
        });
    }
}
