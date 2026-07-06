import { DonationService } from '@app/services/donation/donation.service';
import { SingPayService } from '@app/services/singpay/singpay.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class DonationController {
    router: Router;

    constructor(
        private readonly donationService: DonationService,
        private readonly singPayService: SingPayService,
        //private readonly mailService: MailService,
    ) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * @swagger
         * tags:
         *   - name: Donation
         *     description: Gestion des dons
         */

        /**
         * @swagger
         * /api/donation:
         *   post:
         *     summary: Créer un nouveau don
         *     tags: [Donation]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
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
         *               amount:
         *                 type: number
         *     responses:
         *       201:
         *         description: Don créé avec succès
         *       400:
         *         description: Données invalides
         */
        this.router.post('/', (req: Request, res: Response) => {
            const result = this.donationService.processDonation(req.body);

            if (!result.success) {
                return res.status(StatusCodes.BAD_REQUEST).json(result);
            }
            return res.status(StatusCodes.CREATED).json(result);
        });

        /**
         * @swagger
         * /api/donation/{id}/singpay:
         *   post:
         *     summary: Initier le paiement Singpay pour un don
         *     tags: [Donation]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Lien de paiement Singpay retourné
         *       404:
         *         description: Don introuvable
         *       500:
         *         description: Erreur serveur
         */
        this.router.post('/:id/singpay', async (req: Request, res: Response) => {
            const donId = req.params.id as string;
            const don = this.donationService.getDonationById(donId);
            if (!don) {
                return res.status(404).json({ success: false, message: 'Don introuvable ou expiré' });
            }

            const result = await this.donationService.initiateSingPayPayment(donId);
            if (!result.success) {
                return res.status(500).json({ success: false, message: result.message });
            }

            return res.status(200).json({ success: true, link: result.link });
        });

        /**
         * @swagger
         * /api/donation/payment/verify/{reference}:
         *   get:
         *     summary: Vérifier et finaliser un paiement de don
         *     tags: [Donation]
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
            const reference = req.params.reference as string;
            const result = await this.donationService.verifyAndFinalizeDonation(reference);

            if (!result.success) {
                return res.status(400).json({ success: false, message: result.message });
            }

            return res.status(200).json({ success: true, message: result.message });
        });

        /**
         * @swagger
         * /api/donation/{id}/payment-others:
         *   post:
         *     summary: Enregistrer un don avec paiement par RIB
         *     tags: [Donation]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Don enregistré avec succès
         *       404:
         *         description: Don introuvable
         */
        this.router.post('/:id/payment-others', async (req: Request, res: Response) => {
            const donId = req.params.id as string;
            const result = await this.donationService.saveDonationWithRIB(donId);

            console.log('recu');

            if (!result.success) {
                return res.status(404).json({ success: false, message: result.message });
            }

            return res.status(200).json({ success: true, message: result.message });
        });

        /**
         * @swagger
         * /api/donation/{id}/exists:
         *   get:
         *     summary: Vérifier si un don existe
         *     tags: [Donation]
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Statut d'existence du don
         */
        this.router.get('/:id/exists', (req: Request, res: Response) => {
            const exists = !!this.donationService.getDonationById(req.params.id as string);

            return res.status(StatusCodes.OK).json({ exists });
        });

        /**
         * @swagger
         * /api/donation/payment/status/{reference}:
         *   get:
         *     summary: Obtenir le statut d'un paiement de don
         *     tags: [Donation]
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
         *         description: Don introuvable
         *       502:
         *         description: Erreur de communication avec Singpay
         */
        this.router.get('/payment/status/:reference', async (req, res) => {
            const reference = req.params.reference;
            //const referenceTest = '3aef1481-ee96-4588-beea-a5e69ae2da46';
            const don = this.donationService.getDonationById(reference);
            if (!don) {
                return res.status(404).json({ success: false, message: 'Don introuvable' });
            }

            let result = await this.singPayService.getTransactionByReference(reference);
            if (!result.success) {
                return res.status(502).json({ success: false, message: result.message });
            }

            if (result.success) {
                // Éviter les doublons : tu peux stocker un flag genre don.confirmed = true
                // result = await this.mailService.sendConfirmationEmail('raphin.essono@sing.ga', 'Raphin', 150);
                //result = await this.mailService.sendConfirmationEmail(don.email, don.prenom, don.montant);
            }

            return res.status(200).json({ success: true, status: result.status });
        });
    }
}
