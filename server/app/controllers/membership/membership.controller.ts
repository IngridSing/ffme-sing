import { MembershipService } from '@app/services/membership/membership.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import { Service } from 'typedi';

@Service()
export class MembershipController {
    router: Router;

    constructor(private readonly membershipService: MembershipService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        const upload = multer({ dest: 'uploads/' }); // dossier temporaire

        /**
         * @swagger
         * tags:
         *   - name: Membership
         *     description: Gestion des adhésions
         */

        /**
         * @swagger
         * /api/membership:
         *   post:
         *     summary: Créer une nouvelle demande d'adhésion
         *     tags: [Membership]
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               firstName:
         *                 type: string
         *               lastName:
         *                 type: string
         *               email:
         *                 type: string
         *               phone:
         *                 type: string
         *               cv:
         *                 type: string
         *                 format: binary
         *               photo:
         *                 type: string
         *                 format: binary
         *               id:
         *                 type: string
         *                 format: binary
         *               formulaire:
         *                 type: string
         *                 format: binary
         *     responses:
         *       201:
         *         description: Adhésion créée avec succès
         *       400:
         *         description: Données invalides
         */
        this.router.post(
            '/',
            upload.fields([
                { name: 'cv', maxCount: 1 },
                { name: 'photo', maxCount: 1 },
                { name: 'id', maxCount: 1 },
                { name: 'formulaire', maxCount: 1 },
            ]),
            async (req, res) => {
                const rawData = req.body;
                const parsedData = {
                    ...rawData,
                    consentement: rawData.consentement === 'true',
                };

                const files = req.files as {
                    [fieldname: string]: Express.Multer.File[];
                };

                const normalizedFiles: {
                    [key: string]: {
                        path: string;
                        originalname: string;
                        mimetype: string;
                        size: number;
                    };
                } = {};

                for (const [field, fileArray] of Object.entries(files)) {
                    const file = fileArray[0]; // on prend le premier fichier par champ
                    if (file) {
                        normalizedFiles[field] = {
                            path: file.path,
                            originalname: file.originalname,
                            mimetype: file.mimetype,
                            size: file.size,
                        };
                    }
                }

                const finalData = {
                    ...parsedData,
                    fichiers: normalizedFiles,
                };

                const result = await this.membershipService.processMembership(finalData, normalizedFiles);
                if (!result.success) {
                    return res.status(400).json(result);
                }

                return res.status(201).json(result);
            },
        );

        /**
         * @swagger
         * /api/membership/{id}/exists:
         *   get:
         *     summary: Vérifier si une adhésion existe
         *     tags: [Membership]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Statut d'existence de l'adhésion
         */
        this.router.get('/:id/exists', (req: Request, res: Response) => {
            const exists = !!this.membershipService.getMembershipById(req.params.id as string);
            return res.status(StatusCodes.OK).json({ exists });
        });

        /**
         * @swagger
         * /api/membership/{id}/payment:
         *   post:
         *     summary: Initier le paiement d'une adhésion
         *     tags: [Membership]
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
         *               paymentMethod:
         *                 type: string
         *                 enum: [singpay, rib]
         *               montant:
         *                 type: number
         *                 enum: [15000, 20000]
         *     responses:
         *       200:
         *         description: Paiement initié avec succès
         *       400:
         *         description: Montant invalide
         *       500:
         *         description: Erreur serveur
         */
        this.router.post('/:id/payment', async (req: Request, res: Response) => {
            const { paymentMethod, montant } = req.body;
            const id = req.params.id as string;

            // Vérification du montant
            if (![15000, 20000].includes(Number(montant))) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Montant invalide. Veuillez réessayer.',
                });
            }

            try {
                const result = await this.membershipService.initiatePaymentbyMethod(id, paymentMethod, montant);

                if (!result.success) {
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }

                return res.status(StatusCodes.OK).json(result);
            } catch (error: any) {
                console.error('Erreur serveur :', error);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Erreur serveur inattendue.',
                });
            }
        });

        /**
         * @swagger
         * /api/membership/payment/verify/{reference}:
         *   get:
         *     summary: Vérifier et finaliser le paiement d'une adhésion
         *     tags: [Membership]
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
         *       500:
         *         description: Erreur serveur
         */
        this.router.get('/payment/verify/:reference', async (req, res) => {
            const reference = req.params.reference;

            try {
                const result = await this.membershipService.verifyAndFinalizeSingPayPayment(reference);

                if (!result.success) {
                    return res.status(StatusCodes.BAD_REQUEST).json(result);
                }

                return res.status(StatusCodes.OK).json(result);
            } catch (error: any) {
                console.error('Erreur lors de la vérification du paiement :', error);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Erreur serveur lors de la vérification.',
                });
            }
        });
    }
}
