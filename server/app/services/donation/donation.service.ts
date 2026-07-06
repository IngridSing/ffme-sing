import { DonationData, DonationSchema } from '@app/schemas/donation.schema';
import * as mailType from '@app/utils/generate.email';
import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { Donation } from '@common/interfaces/donation';
import { Transaction } from '@common/interfaces/transaction';
import * as crypto from 'crypto';
import { Service } from 'typedi';
import { DonationDatabaseService } from '../database/donation/donation.database.service';
import { TransactionDatabaseService } from '../database/transaction/transaction.database.service';
import { MailService } from '../mail/mail.service';
import { SingPayService } from '../singpay/singpay.service';

@Service()
export class DonationService {
    private readonly storedDonations: Map<string, DonationData> = new Map();
    private readonly timeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private readonly donationDatabaseService: DonationDatabaseService,
        private readonly transactionDbService: TransactionDatabaseService,
        private readonly singPayService: SingPayService,
        private readonly mailService: MailService,
    ) {}

    processDonation(data: unknown): { success: boolean; message: string; donId?: string } {
        const parsed = DonationSchema.safeParse(data);

        if (!parsed.success) {
            const message = parsed.error.issues.map((e) => e.message).join(', ');
            return { success: false, message };
        }

        const cleanData: DonationData = parsed.data;
        const donId = crypto.randomUUID();

        // Enregistrement dans la Map
        this.storedDonations.set(donId, cleanData);

        console.log(`Don stocké avec ID temporaire ${donId}`);

        return {
            success: true,
            message: 'Don enregistré avec succès',
            donId,
        };
    }

    getDonationById(id: string): DonationData | undefined {
        return this.storedDonations.get(id);
    }

    /**
     * Initie le paiement Singpay et retourne le lien de redirection
     */
    async initiateSingPayPayment(donId: string): Promise<{ success: boolean; link?: string; message?: string }> {
        const don = this.storedDonations.get(donId);
        if (!don) return { success: false, message: 'Don introuvable' };

        // Initier le paiement avec le montant du don
        const payment = await this.singPayService.initiatePayment(donId, don.montant, 'donation');

        if (!payment.success || !payment.link) {
            return { success: false, message: payment.message || 'Erreur lors de l\'initiation du paiement' };
        }

        // Créer une transaction pour traçabilité
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'donation',
            entityId: donId,
            reference: donId,
            amount: don.montant,
            status: 'initiated',
            paymentMethod: PaymentMethod.SING_PAY,
            payerFirstName: don.prenom ?? '',
            payerLastName: don.nom ?? '',
            payerPhone: don.numero ?? '',
            payerEmail: don.email,
            initiatedAt: new Date().toISOString(),
        };

        await this.transactionDbService.create(transaction);

        return { success: true, link: payment.link };
    }

    /**
     * Vérifie le paiement Singpay et finalise le don si confirmé
     */
    async verifyAndFinalizeDonation(donId: string): Promise<{ success: boolean; message: string }> {
        const don = this.storedDonations.get(donId);
        if (!don) return { success: false, message: 'Don introuvable ou déjà traité' };

        // Vérifier le statut du paiement auprès de Singpay
        const tx = await this.singPayService.getTransactionByReference(donId);

        if (!tx.success) {
            return { success: false, message: tx.message || 'Erreur lors de la vérification du paiement' };
        }

        const status = tx.status;
        const result = tx.raw?.result;

        // Vérifier si le paiement est confirmé
        if (status === 'Disbursement' || (status === 'Terminate' && result !== 'TimeOutError')) {
            // ✅ Paiement confirmé : enregistrer le don en base
            const donation: Donation = {
                idDonation: donId,
                projectMotivation: don.motif ?? '',
                firstName: don.prenom ?? '',
                lastName: don.nom ?? '',
                phone: don.numero ?? '',
                email: don.email,
                amount: don.montant,
                paymentMethod: PaymentMethod.SING_PAY,
                isPaid: PaymentStatus.COMPLETED,
                registrationDate: new Date().toISOString(),
            };

            await this.donationDatabaseService.create(donation);
            this.storedDonations.delete(donId);

            const html = mailType.generateConfirmedDonationEmail(don.prenom, don.nom, don.montant, don.numero);
            await this.mailService.sendMail(don.email, 'Confirmation de don', html);

            return { success: true, message: 'Paiement confirmé, don enregistré avec succès.' };
        }

        if (status === 'Terminate' && result === 'TimeOutError') {
            return { success: false, message: 'Le paiement a expiré.' };
        }

        return { success: false, message: `Paiement non confirmé. Statut: ${status}` };
    }

    async saveDonationWithRIB(donId: string): Promise<{ success: boolean; message: string }> {
        const don = this.storedDonations.get(donId);
        if (!don) return { success: false, message: 'Don introuvable' };

        const donation: Donation = {
            idDonation: donId,
            projectMotivation: don.motif ?? '', // ou 'Projet de soutien'
            firstName: don.prenom ?? '',
            lastName: don.nom ?? '',
            phone: don.numero ?? '',
            email: don.email,
            amount: don.montant,
            paymentMethod: PaymentMethod.RIB,
            isPaid: PaymentStatus.PENDING,
            registrationDate: new Date().toISOString(),
        };

        await this.donationDatabaseService.create(donation);
        this.storedDonations.delete(donId);
        const html = mailType.generatePendingDonationEmail(don.prenom, don.montant);

        await this.mailService.sendMail(don.email, 'Confirmation de don', html);

        return { success: true, message: 'Don enregistré avec succès en attente de virement' };
    }

    /**
     * Finalise un don depuis le webhook Singpay
     * Appelé quand le paiement est confirmé via webhook
     */
    async finalizeFromWebhook(donId: string): Promise<{ success: boolean; message: string }> {
        const don = this.storedDonations.get(donId);
        if (!don) {
            // Vérifier si le don n'est pas déjà en base
            const existingDonation = await this.donationDatabaseService.getById(donId);
            if (existingDonation) {
                console.log(`⚠️ Don ${donId} déjà finalisé`);
                return { success: true, message: 'Don déjà enregistré' };
            }
            return { success: false, message: 'Don introuvable' };
        }

        // Enregistrer le don en base
        const donation: Donation = {
            idDonation: donId,
            projectMotivation: don.motif ?? '',
            firstName: don.prenom ?? '',
            lastName: don.nom ?? '',
            phone: don.numero ?? '',
            email: don.email,
            amount: don.montant,
            paymentMethod: PaymentMethod.SING_PAY,
            isPaid: PaymentStatus.COMPLETED,
            registrationDate: new Date().toISOString(),
        };

        await this.donationDatabaseService.create(donation);
        this.storedDonations.delete(donId);

        // Envoyer l'email de confirmation
        const html = mailType.generateConfirmedDonationEmail(don.prenom, don.nom, don.montant, don.numero);
        await this.mailService.sendMail(don.email, 'Confirmation de don', html);

        console.log(`✅ Don ${donId} finalisé via webhook`);
        return { success: true, message: 'Don enregistré avec succès via webhook' };
    }

    // Facultatif : supprimer manuellement un don (ex. après paiement confirmé)
    deleteDonation(id: string): boolean {
        const deleted = this.storedDonations.delete(id);
        const timeout = this.timeouts.get(id);
        if (timeout) clearTimeout(timeout);
        this.timeouts.delete(id);
        return deleted;
    }
}
