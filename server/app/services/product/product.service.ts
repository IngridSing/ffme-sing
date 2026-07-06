import { PendingOrderModel } from '@app/models/pending-order.model';
import { ProductCommandeSchema } from '@app/schemas/product.schema';
import * as mailType from '@app/utils/generate.email';
import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { Product } from '@common/interfaces/product';
import { ProductOrder } from '@common/interfaces/product-order';
import { Transaction } from '@common/interfaces/transaction';
import * as crypto from 'crypto';
import { Service } from 'typedi';
import { ProductDatabaseService } from '../database/product/product.database.service';
import { TransactionDatabaseService } from '../database/transaction/transaction.database.service';
import { MailService } from '../mail/mail.service';
import { SingPayService } from '../singpay/singpay.service';

@Service()
export class ProductService {
    constructor(
        private readonly productDatabaseService: ProductDatabaseService,
        private readonly transactionDbService: TransactionDatabaseService,
        private readonly mailService: MailService,
        private readonly singPayService: SingPayService,
    ) {}

    async getCommandeTemp(orderId: string) {
        const pending = await PendingOrderModel.findOne({ orderId });
        if (!pending) return undefined;
        return {
            montant: pending.totalAmount,
            items: pending.items,
            clientData: pending.clientData,
        };
    }

    async validateAndStoreOrder(commande: {
        items: {
            _id: string;
            versionLabel: string;
            price: number;
            quantity: number;
        }[];
    }): Promise<{ success: boolean; message?: string; orderId?: string; total?: number }> {
        let total = 0;
        const orderItems: { productId: string; title: string; type: string; versionLabel: string; price: number; quantity: number }[] = [];

        for (const item of commande.items) {
            const product = await this.productDatabaseService.getProductById(item._id);
            if (!product) return { success: false, message: `Produit ${item._id} introuvable` };

            const version = product.versions.find((v) => v.label === item.versionLabel);
            if (!version || version.price !== item.price) {
                return { success: false, message: `Produit ou version incorrecte pour ${product.title}` };
            }

            total += version.price * item.quantity;
            orderItems.push({
                productId: item._id,
                title: product.title,
                type: product.type,
                versionLabel: item.versionLabel,
                price: version.price,
                quantity: item.quantity,
            });
        }

        const orderId = crypto.randomUUID();

        // Stocker en BDD avec expiration de 30 minutes
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await PendingOrderModel.create({
            orderId,
            items: orderItems,
            totalAmount: total,
            expiresAt,
        });

        return { success: true, orderId, total };
    }

    /**
     * Stocke les données client et initie le paiement Singpay
     */
    async initiatePayment(
        clientData: any,
        orderId: string,
        montant: number,
    ): Promise<{ success: boolean; message: string; link?: string }> {
        clientData.montant = montant;
        const parsed = ProductCommandeSchema.safeParse(clientData);
        if (!parsed.success) {
            console.error('Erreur de validation côté backend :', parsed.error.flatten());
            const message = parsed.error.issues.map((e) => e.message).join(', ');
            return { success: false, message };
        }

        // Récupérer la commande depuis la BDD
        const pending = await PendingOrderModel.findOne({ orderId });
        if (!pending) {
            return { success: false, message: 'Commande expirée ou introuvable.' };
        }

        if (pending.totalAmount !== Number(montant)) {
            return { success: false, message: 'Montant incorrect.' };
        }

        // Stocker les données client pour la finalisation
        pending.clientData = {
            prenom: parsed.data.prenom,
            nom: parsed.data.nom,
            numero: parsed.data.numero,
            email: parsed.data.email,
        };
        await pending.save();

        // Initier le paiement avec redirection vers le portail Singpay
        const payment = await this.singPayService.initiatePayment(orderId, montant, 'product');
        if (!payment.success || !payment.link) {
            return { success: false, message: payment.message || 'Erreur lors de l\'initiation du paiement' };
        }

        // Créer une transaction pour traçabilité
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'product',
            entityId: orderId,
            reference: orderId,
            amount: montant,
            status: 'initiated',
            paymentMethod: PaymentMethod.SING_PAY,
            payerFirstName: parsed.data.prenom,
            payerLastName: parsed.data.nom,
            payerPhone: parsed.data.numero,
            payerEmail: parsed.data.email,
            initiatedAt: new Date().toISOString(),
        };

        await this.transactionDbService.create(transaction);

        return { success: true, message: 'Redirection vers Sing Pay...', link: payment.link };
    }

    /**
     * Vérifie le paiement et finalise la commande si confirmé
     */
    async verifyAndFinalizeOrder(orderId: string): Promise<{ success: boolean; message: string }> {
        // Récupérer la commande depuis la BDD
        const pending = await PendingOrderModel.findOne({ orderId });
        if (!pending || !pending.clientData) {
            return { success: false, message: 'Commande introuvable ou déjà traitée.' };
        }

        // Vérifier le statut du paiement auprès de Singpay
        const tx = await this.singPayService.getTransactionByReference(orderId);

        if (!tx.success) {
            return { success: false, message: tx.message || 'Erreur lors de la vérification du paiement' };
        }

        const status = tx.status;
        const result = tx.raw?.result;

        // Vérifier si le paiement est confirmé
        if (status === 'Disbursement' || (status === 'Terminate' && result !== 'TimeOutError')) {
            // Récupérer les produits complets pour la commande finale
            const products: Product[] = [];
            for (const item of pending.items) {
                const product = await this.productDatabaseService.getProductById(item.productId);
                if (product) {
                    products.push(product);
                }
            }

            // ✅ Paiement confirmé : enregistrer la commande
            const finalCommande: ProductOrder = {
                _id: '',
                idOrder: orderId,
                firstName: pending.clientData.prenom,
                lastName: pending.clientData.nom,
                phone: pending.clientData.numero,
                email: pending.clientData.email,
                isPaid: PaymentStatus.COMPLETED,
                paymentMethod: PaymentMethod.SING_PAY,
                date: new Date().toISOString(),
                totalAmount: pending.totalAmount,
                items: pending.items.map((item) => ({
                    productId: item.productId,
                    title: item.title,
                    type: item.type,
                    versionLabel: item.versionLabel,
                    price: item.price,
                    quantity: item.quantity,
                })),
                products: products,
            };

            await this.productDatabaseService.createProductOrder(finalCommande);

            // Mettre à jour la transaction comme complétée
            await this.transactionDbService.updateStatus(orderId, 'completed', {
                singpayStatus: status,
                singpayRawResponse: tx.raw,
                verifiedAt: new Date().toISOString(),
            });

            // Supprimer la commande en attente
            await PendingOrderModel.deleteOne({ orderId });

            const html = mailType.generateOrderConfirmationEmail(
                pending.clientData.prenom,
                pending.clientData.nom,
                pending.totalAmount,
                pending.clientData.numero,
                pending.items.map((item) => ({
                    title: item.title || '',
                    type: item.type || '',
                })),
            );
            await this.mailService.sendMail(pending.clientData.email, 'Confirmation de commande', html);

            return { success: true, message: 'Paiement confirmé, commande enregistrée.' };
        }

        if (status === 'Terminate' && result === 'TimeOutError') {
            // Mettre à jour la transaction comme expirée
            await this.transactionDbService.updateStatus(orderId, 'timeout', {
                singpayStatus: status,
                singpayRawResponse: tx.raw,
                verifiedAt: new Date().toISOString(),
            });
            return { success: false, message: 'Le paiement a expiré.' };
        }

        // Mettre à jour la transaction comme échouée
        if (status === 'Failed' || result === 'Failed') {
            await this.transactionDbService.updateStatus(orderId, 'failed', {
                singpayStatus: status,
                singpayRawResponse: tx.raw,
                verifiedAt: new Date().toISOString(),
            });
        }

        return { success: false, message: `Paiement non confirmé. Statut: ${status}` };
    }
}
