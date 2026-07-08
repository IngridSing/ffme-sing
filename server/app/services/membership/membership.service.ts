import { MembershipData, MembershipSchema } from '@app/schemas/membership.schema';
import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { Member } from '@common/interfaces/member';
import { Transaction } from '@common/interfaces/transaction';
import * as crypto from 'crypto';
import { Service } from 'typedi';
import { MemberDatabaseService } from '../database/member/member.databse.service';
import { MongoStorageService } from '../database/member/mongo-storage.service';
import { TransactionDatabaseService } from '../database/transaction/transaction.database.service';
import { SingPayService } from '../singpay/singpay.service';

@Service()
export class MembershipService {
    private readonly storedMemberships: Map<string, MembershipData> = new Map();
    private readonly timeouts: Map<string, NodeJS.Timeout> = new Map();

    private readonly EXPIRATION_MS = 2 * 60 * 1000; //2 minutes

    constructor(
        private readonly mongoStorageService: MongoStorageService,
        private readonly singPayService: SingPayService,
        private readonly memberDatabaseService: MemberDatabaseService,
        private readonly transactionDbService: TransactionDatabaseService,
    ) {}

    async processMembership(
        data: unknown,
        files: { [key: string]: { path: string; originalname: string; mimetype: string } },
    ): Promise<{ success: boolean; message: string; membershipId?: string }> {
        const parsed = MembershipSchema.safeParse(data);

        if (!parsed.success) {
            const message = parsed.error.issues.map((e) => e.message).join(', ');
            return { success: false, message };
        }

        const cleanData: MembershipData = parsed.data;
        const membershipId = crypto.randomUUID();

        const uploadResult = await this.mongoStorageService.uploadTempFiles(membershipId, files);

        if (!uploadResult.success) {
            return {
                success: false,
                message: `Erreur lors de l'envoi des fichiers : ${uploadResult.error}`,
            };
        }

        // Injecter les IDs dans cleanData.fichiers (avec typage temporaire)
        (cleanData as any).fichiers = {};
        for (const [key, file] of Object.entries(files)) {
            (cleanData as any).fichiers[key] = {
                originalname: file.originalname,
                mimetype: file.mimetype,
                id: uploadResult.ids?.[key] || '',
            };
        }

        // Stockage temporaire en mémoire
        this.storedMemberships.set(membershipId, cleanData);
        this.timeouts.set(
            membershipId,
            setTimeout(async () => {
                await this.deleteMembership(membershipId);
                console.log(`Adhésion expirée : ${membershipId}`);
            }, this.EXPIRATION_MS),
        );

        console.log(`Adhésion stockée avec ID ${membershipId}`);
        return {
            success: true,
            message: 'Demande d’adhésion enregistrée avec succès.',
            membershipId,
        };
    }

    getMembershipById(id: string): MembershipData | undefined {
        return this.storedMemberships.get(id);
    }

    async initiatePaymentbyMethod(
        membershipId: string,
        method: PaymentMethod,
        montant: number,
    ): Promise<{ success: boolean; member?: Member; message?: string; link?: string }> {
        const data = this.storedMemberships.get(membershipId);

        if (!data) {
            return { success: false, message: 'Adhésion introuvable' };
        }

        // Mise à jour du moyen de paiement dans les données temporaires
        (data as any).paymentMethod = method;

        const member: Member = {
            idMember: membershipId,
            firstName: data.prenom,
            lastName: data.nom,
            typeMember: data.typeAdhesion,
            isValidated: false,
            registrationDate: new Date().toString(),
            phone: data.numero,
            email: data.email,
            paymentMethod: method,
            paymentStatus: PaymentStatus.PENDING,
            amount: montant,
            additionalDocuments: [],
        };

        const timeout = this.timeouts.get(membershipId);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(membershipId);
        }
        // Si SING PAY - Redirection vers le portail de paiement
        if (method === PaymentMethod.SING_PAY) {
            const result = await this.singPayService.initiatePayment(membershipId, montant, 'membership');
            if (!result.success) {
                return {
                    success: false,
                    message: result.message || "Échec lors de l'initiation du paiement.",
                };
            }

            // Créer une transaction pour traçabilité
            const transaction: Transaction = {
                id: crypto.randomUUID(),
                type: 'membership',
                entityId: membershipId,
                reference: membershipId,
                amount: montant,
                status: 'initiated',
                paymentMethod: PaymentMethod.SING_PAY,
                payerFirstName: data.prenom,
                payerLastName: data.nom,
                payerPhone: data.numero,
                payerEmail: data.email,
                initiatedAt: new Date().toISOString(),
            };

            await this.transactionDbService.create(transaction);

            return {
                success: true,
                message: 'Redirection vers Sing Pay...',
                link: result.link,
            };
        }

        // Déplacer les fichiers temporaires vers le stockage définitif (GridFS)
        const moveResult = await this.mongoStorageService.moveTempToValid(membershipId);

        if (!moveResult.success) {
            return {
                success: false,
                message: `Erreur lors du déplacement des fichiers : ${moveResult.error}`,
            };
        }

        // 4. Créer un objet final Member
        member.additionalDocuments = Object.entries(data.fichiers).map(([key, file]) => ({
            title: key,
            path: `/membership-valid/${membershipId}/${file.originalname}`, // Path CMS
        }));

        // 5. Enregistrer dans MongoDB
        //await this.saveMemberToDatabase(finalMember);
        await this.memberDatabaseService.create(member);

        // 2. Supprimer l’adhésion temporaire
        this.storedMemberships.delete(membershipId);

        // 6. Retourner confirmation
        return {
            success: true,
            message: 'Votre adhésion a été enregistrée. Vous recevrez les instructions par email.',
        };
    }

    async verifyAndFinalizeSingPayPayment(membershipId: string): Promise<{ success: boolean; message: string }> {
        const data = this.storedMemberships.get(membershipId);

        if (!data) {
            return { success: false, message: 'Adhésion introuvable ou expirée.' };
        }

        // Vérifier le statut du paiement via Singpay
        const tx = await this.singPayService.getTransactionByReference(membershipId);

        if (!tx.success) {
            return { success: false, message: tx.message || 'Impossible de vérifier le paiement.' };
        }

        const status = tx.status;
        const result = tx.raw?.result;

        // Vérifier si le paiement est confirmé
        if (status !== 'Disbursement' && !(status === 'Terminate' && result !== 'TimeOutError')) {
            if (status === 'Terminate' && result === 'TimeOutError') {
                this.storedMemberships.delete(membershipId);
                return { success: false, message: 'Le paiement a expiré.' };
            }
            return { success: false, message: 'Paiement en attente ou échoué.' };
        }

        // Paiement confirmé : créer le membre
        const member: Member = {
            idMember: membershipId,
            firstName: data.prenom,
            lastName: data.nom,
            typeMember: data.typeAdhesion,
            isValidated: false,
            registrationDate: new Date().toString(),
            phone: data.numero,
            email: data.email,
            paymentMethod: PaymentMethod.SING_PAY,
            paymentStatus: PaymentStatus.COMPLETED,
            amount: 15000,
            additionalDocuments: Object.entries(data.fichiers).map(([key, file]) => ({
                title: key,
                path: `/membership-valid/${membershipId}/${file.originalname}`,
            })),
        };

        // Déplacer les fichiers vers le dossier permanent
        const moveResult = await this.mongoStorageService.moveTempToValid(membershipId);

        if (!moveResult.success) {
            return {
                success: false,
                message: `Erreur lors du déplacement des fichiers : ${moveResult.error}`,
            };
        }

        // Enregistrer le membre dans la base de données
        await this.memberDatabaseService.create(member);

        // Supprimer les données temporaires
        this.storedMemberships.delete(membershipId);
        const timeout = this.timeouts.get(membershipId);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(membershipId);
        }

        return { success: true, message: 'Paiement confirmé et adhésion enregistrée.' };
    }

    /**
     * Finalise une adhésion depuis le webhook Singpay
     * Appelé quand le paiement est confirmé via webhook
     */
    async finalizeFromWebhook(membershipId: string): Promise<{ success: boolean; message: string }> {
        const data = this.storedMemberships.get(membershipId);

        if (!data) {
            // Vérifier si le membre n'est pas déjà en base
            const existingMember = await this.memberDatabaseService.getById(membershipId);
            if (existingMember?.member) {
                console.log(`⚠️ Membre ${membershipId} déjà finalisé`);
                return { success: true, message: 'Adhésion déjà enregistrée' };
            }
            return { success: false, message: 'Adhésion introuvable ou expirée' };
        }

        // Créer le membre
        const member: Member = {
            idMember: membershipId,
            firstName: data.prenom,
            lastName: data.nom,
            typeMember: data.typeAdhesion,
            isValidated: false,
            registrationDate: new Date().toString(),
            phone: data.numero,
            email: data.email,
            paymentMethod: PaymentMethod.SING_PAY,
            paymentStatus: PaymentStatus.COMPLETED,
            amount: 15000,
            additionalDocuments: Object.entries(data.fichiers).map(([key, file]) => ({
                title: key,
                path: `/membership-valid/${membershipId}/${file.originalname}`,
            })),
        };

        // Déplacer les fichiers vers le dossier permanent
        const moveResult = await this.mongoStorageService.moveTempToValid(membershipId);

        if (!moveResult.success) {
            return {
                success: false,
                message: `Erreur lors du déplacement des fichiers : ${moveResult.error}`,
            };
        }

        // Enregistrer le membre dans la base de données
        await this.memberDatabaseService.create(member);

        // Supprimer les données temporaires
        this.storedMemberships.delete(membershipId);
        const timeout = this.timeouts.get(membershipId);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(membershipId);
        }

        console.log(`✅ Adhésion ${membershipId} finalisée via webhook`);
        return { success: true, message: 'Adhésion enregistrée avec succès via webhook' };
    }

    async deleteMembership(id: string): Promise<boolean> {
        const deleted = this.storedMemberships.delete(id);
        const timeout = this.timeouts.get(id);
        if (timeout) clearTimeout(timeout);
        this.timeouts.delete(id);
        try {
            await this.mongoStorageService.deleteTempFiles(id);
            console.log(`Fichiers temporaires supprimés pour l'adhésion ${id}.`);
        } catch (err) {
            console.warn(`Impossible de supprimer les fichiers temporaires de ${id} :`, err);
        }
        return deleted;
    }
}
