import { CommentSchema } from '@app/schemas/product.schema';
import { ProductDatabaseService } from '@app/services/database/product/product.database.service';
import { ProductService } from '@app/services/product/product.service';
import { SingPayService } from '@app/services/singpay/singpay.service';
import { streamImageResponse } from '@app/utils/image-route.util';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class ProductController {
    router: Router;

    constructor(
        private readonly productService: ProductService,
        private readonly productDatabaseService: ProductDatabaseService,
        private readonly singPayService: SingPayService,
    ) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        /**
         * @swagger
         * tags:
         *   - name: Product
         *     description: Gestion des produits et commandes
         */

        /**
         * @swagger
         * /api/product/order:
         *   post:
         *     summary: Créer une nouvelle commande
         *     tags: [Product]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               items:
         *                 type: array
         *                 items:
         *                   type: object
         *                   properties:
         *                     productId:
         *                       type: string
         *                     quantity:
         *                       type: number
         *                     versionLabel:
         *                       type: string
         *     responses:
         *       200:
         *         description: Commande créée avec succès
         *       400:
         *         description: Données invalides
         */
        this.router.post('/order', async (req: Request, res: Response) => {
            try {
                const result = await this.productService.validateAndStoreOrder(req.body);
                if (!result.success) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: result.message });
                }
                return res.status(StatusCodes.OK).json({ success: true, orderId: result.orderId, total: result.total });
            } catch (err) {
                console.error('❌ Erreur création commande:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/product/order-payment:
         *   post:
         *     summary: Initier le paiement d'une commande
         *     tags: [Product]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               orderId:
         *                 type: string
         *               montant:
         *                 type: number
         *               firstName:
         *                 type: string
         *               lastName:
         *                 type: string
         *               email:
         *                 type: string
         *               phone:
         *                 type: string
         *     responses:
         *       200:
         *         description: Lien de paiement retourné
         *       400:
         *         description: Erreur lors de l'initiation du paiement
         */
        this.router.post('/order-payment', async (req: Request, res: Response) => {
            try {
                const { orderId, montant, ...clientData } = req.body;

                const result = await this.productService.initiatePayment(clientData, orderId, montant);

                if (!result.success) {
                    return res.status(400).json({ success: false, message: result.message });
                }

                return res.status(StatusCodes.OK).json({ success: true, message: result.message, link: result.link });
            } catch (err) {
                console.error('❌ Erreur paiement commande:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/product/payment/verify/{reference}:
         *   get:
         *     summary: Vérifier et finaliser le paiement d'une commande
         *     tags: [Product]
         *     parameters:
         *       - in: path
         *         name: reference
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Paiement vérifié avec succès
         *       400:
         *         description: Paiement non validé
         */
        this.router.get('/payment/verify/:reference', async (req: Request, res: Response) => {
            try {
                const reference = req.params.reference as string;
                const result = await this.productService.verifyAndFinalizeOrder(reference);

                if (!result.success) {
                    return res.status(400).json({ success: false, message: result.message });
                }

                return res.status(StatusCodes.OK).json({ success: true, message: result.message });
            } catch (err) {
                console.error('❌ Erreur vérification commande:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/product/{id}/comment:
         *   post:
         *     summary: Ajouter un commentaire sur un produit
         *     tags: [Product]
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
         *               author:
         *                 type: string
         *               content:
         *                 type: string
         *               rating:
         *                 type: number
         *     responses:
         *       200:
         *         description: Commentaire ajouté avec succès
         *       400:
         *         description: Données invalides
         *       404:
         *         description: Produit introuvable
         */
        this.router.post('/:id/comment', async (req: Request, res: Response) => {
            try {
                const productId = req.params.id as string;

                const parseResult = CommentSchema.safeParse(req.body);
                if (!parseResult.success) {
                    return res.status(400).json({ message: 'Données invalides', errors: parseResult.error.flatten() });
                }

                const commentData = parseResult.data;

                const updated = await this.productDatabaseService.addComment(productId, commentData);
                if (!updated) return res.status(404).json({ message: 'Produit introuvable' });

                return res.status(200).json({ message: 'Commentaire ajouté avec succès' });
            } catch (error) {
                console.error('❌ Erreur lors de l’ajout du commentaire :', error);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/product:
         *   get:
         *     summary: Récupérer tous les produits
         *     tags: [Product]
         *     responses:
         *       200:
         *         description: Liste des produits
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/', async (_req: Request, res: Response) => {
            try {
                const products = await this.productDatabaseService.getAllProducts();
                return res.status(StatusCodes.OK).json(products);
            } catch (err) {
                console.error('❌ [GET] Erreur récupération produits publics :', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/product/image/{filename}:
         *   get:
         *     summary: Récupérer l'image d'un produit
         *     tags: [Product]
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
        this.router.get('/image/*splat', async (req: Request, res: Response) => {
            await streamImageResponse(req, res, (filename) => this.productDatabaseService.streamImage(filename), 'Erreur affichage image.');
        });

        /**
         * @swagger
         * /api/product/payment/status/{reference}:
         *   get:
         *     summary: Obtenir le statut d'un paiement de commande
         *     tags: [Product]
         *     parameters:
         *       - in: path
         *         name: reference
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Statut du paiement retourné
         *       404:
         *         description: Commande introuvable
         *       502:
         *         description: Erreur de communication avec Singpay
         */
        this.router.get('/payment/status/:reference', async (req: Request, res: Response) => {
            try {
                const reference = req.params.reference as string;
                const commande = this.productService.getCommandeTemp(reference);

                if (!commande) {
                    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Commande introuvable' });
                }

                const result = await this.singPayService.getTransactionByReference(reference);

                if (!result.success) {
                    return res.status(StatusCodes.BAD_GATEWAY).json({ success: false, message: result.message });
                }

                return res.status(StatusCodes.OK).json({ success: true, status: result.status });
            } catch (err) {
                console.error('❌ Erreur vérification paiement:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/product/{id}/comments:
         *   get:
         *     summary: Récupérer les commentaires validés d'un produit
         *     tags: [Product]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Liste des commentaires validés
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/:id/comments/', async (req: Request, res: Response) => {
            try {
                const productId = req.params.id as string;
                const comments = await this.productDatabaseService.getValidatedCommentsByProductId(productId);
                return res.status(200).json(comments);
            } catch (err) {
                console.error('❌ Erreur récupération des commentaires validés :', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
        });

        /**
         * @swagger
         * /api/product/{id}:
         *   get:
         *     summary: Récupérer un produit par son ID
         *     tags: [Product]
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
        this.router.get('/:id', async (req: Request, res: Response) => {
            try {
                const product = await this.productDatabaseService.getProductById(req.params.id as string);
                if (!product) {
                    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Produit introuvable' });
                }
                return res.status(StatusCodes.OK).json(product);
            } catch (err) {
                console.error('❌ Erreur récupération produit:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur serveur' });
            }
        });
    }
}
