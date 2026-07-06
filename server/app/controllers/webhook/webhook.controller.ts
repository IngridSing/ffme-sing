import { authenticateToken } from '@app/middlewares/auth.middleware';
import { TransactionDatabaseService } from '@app/services/database/transaction/transaction.database.service';
import { DonationService } from '@app/services/donation/donation.service';
import { MembershipService } from '@app/services/membership/membership.service';
import { ProductService } from '@app/services/product/product.service';
import { TransactionReconciliationService } from '@app/services/transaction/transaction.reconciliation.service';
import { PaymentMethod } from '@common/enums/payment-method';
import { Transaction, TransactionStatus, TransactionType } from '@common/interfaces/transaction';
import * as crypto from 'crypto';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

@Service()
export class WebhookController {
    router: Router;

    constructor(
        private readonly transactionDbService: TransactionDatabaseService,
        private readonly donationService: DonationService,
        private readonly membershipService: MembershipService,
        private readonly productService: ProductService,
        private readonly reconciliationService: TransactionReconciliationService,
    ) {
        this.router = Router();
        this.configureRoutes();
    }

    /**
     * Affiche les transactions de manière formatée dans la console
     */
    private logTransactionsToConsole(transactions: Transaction[], title: string): void {
        console.log('\n' + '='.repeat(80));
        console.log(`📊 ${title}`);
        console.log('='.repeat(80));

        if (transactions.length === 0) {
            console.log('   Aucune transaction trouvée.');
            console.log('='.repeat(80) + '\n');
            return;
        }

        // En-tête du tableau
        console.log(
            '| ' +
                'Référence'.padEnd(20) +
                ' | ' +
                'Type'.padEnd(12) +
                ' | ' +
                'Statut'.padEnd(12) +
                ' | ' +
                'Montant'.padEnd(10) +
                ' | ' +
                'Payeur'.padEnd(25) +
                ' | ' +
                'Date'.padEnd(20) +
                ' |',
        );
        console.log('|' + '-'.repeat(22) + '|' + '-'.repeat(14) + '|' + '-'.repeat(14) + '|' + '-'.repeat(12) + '|' + '-'.repeat(27) + '|' + '-'.repeat(22) + '|');

        for (const tx of transactions) {
            const statusEmoji = this.getStatusEmoji(tx.status);
            const typeLabel = this.getTypeLabel(tx.type);
            const payerName = `${tx.payerFirstName} ${tx.payerLastName}`.substring(0, 23);
            const date = tx.initiatedAt ? new Date(tx.initiatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

            console.log(
                '| ' +
                    tx.reference.substring(0, 18).padEnd(20) +
                    ' | ' +
                    typeLabel.padEnd(12) +
                    ' | ' +
                    `${statusEmoji} ${tx.status}`.padEnd(12) +
                    ' | ' +
                    `${tx.amount} FCFA`.padEnd(10) +
                    ' | ' +
                    payerName.padEnd(25) +
                    ' | ' +
                    date.padEnd(20) +
                    ' |',
            );
        }

        console.log('='.repeat(80));
        console.log(`   Total: ${transactions.length} transaction(s)`);
        console.log('='.repeat(80) + '\n');
    }

    private getStatusEmoji(status: TransactionStatus): string {
        switch (status) {
            case 'completed':
                return '✅';
            case 'pending':
                return '⏳';
            case 'initiated':
                return '🔄';
            case 'failed':
                return '❌';
            case 'timeout':
                return '⏰';
            case 'cancelled':
                return '🚫';
            default:
                return '❓';
        }
    }

    private getTypeLabel(type: TransactionType): string {
        switch (type) {
            case 'donation':
                return 'Don';
            case 'membership':
                return 'Adhésion';
            case 'product':
                return 'Commande';
            default:
                return type;
        }
    }

    private configureRoutes(): void {
        /**
         * @swagger
         * tags:
         *   - name: Webhook
         *     description: Webhooks et transactions Singpay
         */

        /**
         * @swagger
         * /api/webhook/singpay:
         *   post:
         *     summary: Webhook Singpay - Reçoit les notifications de paiement
         *     tags: [Webhook]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               reference:
         *                 type: string
         *               transactionId:
         *                 type: string
         *               status:
         *                 type: string
         *               result:
         *                 type: string
         *               amount:
         *                 type: number
         *               paidAt:
         *                 type: string
         *               payerPhone:
         *                 type: string
         *     responses:
         *       200:
         *         description: Webhook traité avec succès
         *       400:
         *         description: Référence manquante
         *       500:
         *         description: Erreur serveur
         */
        this.router.post('/singpay', async (req: Request, res: Response) => {
            const { reference, transactionId, status, result, amount, paidAt, payerPhone, payerName, type } = req.body;

            // Log détaillé du webhook reçu
            console.log('\n' + '█'.repeat(70));
            console.log('📥 WEBHOOK SINGPAY REÇU');
            console.log('█'.repeat(70));
            console.log(`   Référence     : ${reference || 'N/A'}`);
            console.log(`   Transaction   : ${transactionId || 'N/A'}`);
            console.log(`   Statut        : ${status || 'N/A'}`);
            console.log(`   Résultat      : ${result || 'N/A'}`);
            if (amount) console.log(`   Montant       : ${amount} FCFA`);
            if (paidAt) console.log(`   Payé le       : ${paidAt}`);
            if (payerPhone) console.log(`   Téléphone     : ${payerPhone}`);
            if (payerName) console.log(`   Payeur        : ${payerName}`);
            console.log('─'.repeat(70));

            try {
                if (!reference) {
                    console.error('❌ Webhook sans référence');
                    return res.status(400).json({ success: false, message: 'Référence manquante' });
                }

                // Récupérer la transaction existante
                let transaction = await this.transactionDbService.getByReference(reference);

                // Si la transaction n'existe pas, la créer (fallback pour les webhooks reçus avant l'initiation)
                if (!transaction) {
                    console.log(`⚠️ Transaction non trouvée en BDD, création automatique: ${reference}`);

                    // Déterminer le type de transaction (par défaut: donation)
                    const transactionType: TransactionType = type || 'donation';

                    const newTransaction: Transaction = {
                        id: crypto.randomUUID(),
                        type: transactionType,
                        entityId: reference,
                        reference: reference,
                        amount: amount || 0,
                        status: 'pending',
                        paymentMethod: PaymentMethod.SING_PAY,
                        payerFirstName: payerName?.split(' ')[0] || 'Inconnu',
                        payerLastName: payerName?.split(' ').slice(1).join(' ') || '',
                        payerPhone: payerPhone || '',
                        payerEmail: '',
                        initiatedAt: new Date().toISOString(),
                        singpayTransactionId: transactionId,
                        singpayStatus: status,
                        singpayRawResponse: req.body,
                        webhookReceivedAt: new Date().toISOString(),
                    };

                    transaction = await this.transactionDbService.create(newTransaction);
                    console.log(`✅ Transaction créée depuis webhook: ${reference}`);
                }

                // Déterminer le nouveau statut
                const isSuccess = status === 'Disbursement' || (status === 'Terminate' && result !== 'TimeOutError' && result !== 'Failed');
                const isFailed = status === 'Failed' || result === 'Failed';
                const isTimeout = result === 'TimeOutError';
                const isPending = status === 'Pending' || status === 'Processing' || status === 'Initiated';

                let newStatus: TransactionStatus;
                if (isSuccess) {
                    newStatus = 'completed';
                } else if (isFailed) {
                    newStatus = 'failed';
                } else if (isTimeout) {
                    newStatus = 'timeout';
                } else if (isPending) {
                    newStatus = 'pending';
                } else {
                    // Si statut inconnu mais webhook reçu, mettre en pending
                    newStatus = 'pending';
                }

                // Mettre à jour la transaction
                await this.transactionDbService.updateStatus(reference, newStatus, {
                    singpayTransactionId: transactionId,
                    singpayStatus: status,
                    singpayRawResponse: req.body,
                    webhookReceivedAt: new Date().toISOString(),
                });

                // Si le paiement est confirmé, finaliser l'entité associée
                if (newStatus === 'completed') {
                    console.log(`✅ Paiement confirmé pour ${transaction.type}: ${reference}`);

                    if (transaction.type === 'donation') {
                        await this.donationService.finalizeFromWebhook(transaction.entityId);
                    } else if (transaction.type === 'membership') {
                        await this.membershipService.finalizeFromWebhook(transaction.entityId);
                    } else if (transaction.type === 'product') {
                        await this.productService.verifyAndFinalizeOrder(transaction.entityId);
                    }
                }

                // Log des transactions échouées ou en timeout
                if (newStatus === 'failed' || newStatus === 'timeout') {
                    console.log('\n' + '⚠'.repeat(35));
                    console.log(`❌ TRANSACTION ${newStatus.toUpperCase()}`);
                    console.log('⚠'.repeat(35));
                    console.log(`   Référence : ${reference}`);
                    console.log(`   Type      : ${transaction.type}`);
                    console.log(`   Montant   : ${transaction.amount} FCFA`);
                    console.log(`   Payeur    : ${transaction.payerFirstName} ${transaction.payerLastName}`);
                    console.log(`   Raison    : ${result || status}`);
                    console.log('⚠'.repeat(35) + '\n');
                }

                // Log du résultat final
                const statusEmoji = this.getStatusEmoji(newStatus);
                console.log(`   Nouveau statut: ${statusEmoji} ${newStatus.toUpperCase()}`);
                console.log('█'.repeat(70) + '\n');

                return res.status(200).json({ success: true, status: newStatus });
            } catch (error: any) {
                console.log(`   ❌ ERREUR: ${error.message}`);
                console.log('█'.repeat(70) + '\n');
                return res.status(500).json({ success: false, message: error.message });
            }
        });

        /**
         * @swagger
         * /api/webhook/verify/{reference}:
         *   get:
         *     summary: Vérification manuelle d'une transaction
         *     tags: [Webhook]
         *     parameters:
         *       - in: path
         *         name: reference
         *         required: true
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Détails de la transaction
         *       404:
         *         description: Transaction non trouvée
         */
        this.router.get('/verify/:reference', async (req: Request, res: Response) => {
            const reference = req.params.reference as string;

            try {
                const transaction = await this.transactionDbService.getByReference(reference);

                if (!transaction) {
                    return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
                }

                return res.status(200).json({
                    success: true,
                    transaction: {
                        id: transaction.id,
                        type: transaction.type,
                        status: transaction.status,
                        amount: transaction.amount,
                        initiatedAt: transaction.initiatedAt,
                        completedAt: transaction.completedAt,
                        singpayStatus: transaction.singpayStatus,
                    },
                });
            } catch (error: any) {
                return res.status(500).json({ success: false, message: error.message });
            }
        });

        /**
         * @swagger
         * /api/webhook/transactions:
         *   get:
         *     summary: Liste des transactions avec filtres
         *     tags: [Webhook]
         *     parameters:
         *       - in: query
         *         name: status
         *         schema:
         *           type: string
         *           enum: [completed, pending, failed, all]
         *       - in: query
         *         name: type
         *         schema:
         *           type: string
         *           enum: [donation, membership, product]
         *       - in: query
         *         name: limit
         *         schema:
         *           type: number
         *       - in: query
         *         name: console
         *         schema:
         *           type: boolean
         *     responses:
         *       200:
         *         description: Liste des transactions
         */
        this.router.get('/transactions', async (req: Request, res: Response) => {
            try {
                const status = req.query.status as string | undefined;
                const type = req.query.type as TransactionType | undefined;
                const limit = parseInt(req.query.limit as string) || 50;
                const showInConsole = req.query.console === 'true';

                let transactions: Transaction[];
                let title = 'TOUTES LES TRANSACTIONS';

                if (status && status !== 'all') {
                    transactions = await this.transactionDbService.getByStatus(status as TransactionStatus);
                    title = `TRANSACTIONS ${status.toUpperCase()}`;
                } else {
                    transactions = await this.transactionDbService.getRecentTransactions(limit);
                }

                // Filtrer par type si spécifié
                if (type) {
                    transactions = transactions.filter((tx) => tx.type === type);
                    title += ` (${this.getTypeLabel(type)})`;
                }

                // Limiter le nombre
                transactions = transactions.slice(0, limit);

                // Afficher dans la console si demandé
                if (showInConsole) {
                    this.logTransactionsToConsole(transactions, title);
                }

                return res.status(200).json({
                    success: true,
                    count: transactions.length,
                    filters: { status: status || 'all', type: type || 'all', limit },
                    transactions,
                });
            } catch (error: any) {
                return res.status(500).json({ success: false, message: error.message });
            }
        });

        /**
         * @swagger
         * /api/webhook/transactions/{status}:
         *   get:
         *     summary: Raccourcis pour filtrer par statut
         *     tags: [Webhook]
         *     parameters:
         *       - in: path
         *         name: status
         *         required: true
         *         schema:
         *           type: string
         *           enum: [completed, pending, failed, initiated, timeout, cancelled, all]
         *       - in: query
         *         name: type
         *         schema:
         *           type: string
         *           enum: [donation, membership, product]
         *       - in: query
         *         name: limit
         *         schema:
         *           type: number
         *     responses:
         *       200:
         *         description: Liste des transactions filtrées
         *       400:
         *         description: Statut invalide
         */
        this.router.get('/transactions/:status', async (req: Request, res: Response) => {
            try {
                const status = req.params.status as string;
                const type = req.query.type as TransactionType | undefined;
                const limit = parseInt(req.query.limit as string) || 50;

                let transactions: Transaction[];
                let title: string;

                if (status === 'all') {
                    transactions = await this.transactionDbService.getAll();
                    title = 'TOUTES LES TRANSACTIONS';
                } else if (['completed', 'pending', 'failed', 'initiated', 'timeout', 'cancelled'].includes(status)) {
                    transactions = await this.transactionDbService.getByStatus(status as TransactionStatus);
                    title = `TRANSACTIONS ${status.toUpperCase()}`;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Statut invalide. Utilisez: completed, pending, failed, initiated, timeout, cancelled, all',
                    });
                }

                // Filtrer par type si spécifié
                if (type) {
                    transactions = transactions.filter((tx) => tx.type === type);
                    title += ` (${this.getTypeLabel(type)})`;
                }

                // Limiter le nombre
                transactions = transactions.slice(0, limit);

                // Toujours afficher dans la console pour ces routes
                this.logTransactionsToConsole(transactions, title);

                return res.status(200).json({
                    success: true,
                    status,
                    count: transactions.length,
                    transactions,
                });
            } catch (error: any) {
                return res.status(500).json({ success: false, message: error.message });
            }
        });

        /**
         * @swagger
         * /api/webhook/stats:
         *   get:
         *     summary: Statistiques des transactions
         *     tags: [Webhook]
         *     responses:
         *       200:
         *         description: Statistiques des transactions
         */
        this.router.get('/stats', async (_req: Request, res: Response) => {
            try {
                const stats = await this.transactionDbService.getStats();

                // Afficher les stats dans la console
                console.log('\n' + '='.repeat(60));
                console.log('📊 STATISTIQUES DES TRANSACTIONS');
                console.log('='.repeat(60));
                console.log(`   Total transactions     : ${stats.total}`);
                console.log(`   ✅ Complétées          : ${stats.byStatus.completed}`);
                console.log(`   ⏳ En attente          : ${stats.byStatus.pending}`);
                console.log(`   🔄 Initiées            : ${stats.byStatus.initiated}`);
                console.log(`   ❌ Échouées            : ${stats.byStatus.failed}`);
                console.log(`   ⏰ Timeout             : ${stats.byStatus.timeout}`);
                console.log(`   🚫 Annulées            : ${stats.byStatus.cancelled}`);
                console.log('-'.repeat(60));
                console.log(`   Par type:`);
                console.log(`     - Dons               : ${stats.byType.donation}`);
                console.log(`     - Adhésions          : ${stats.byType.membership}`);
                console.log(`     - Commandes          : ${stats.byType.product}`);
                console.log('-'.repeat(60));
                console.log(`   Montant total          : ${stats.totalAmount} FCFA`);
                console.log(`   Montant encaissé       : ${stats.completedAmount} FCFA`);
                console.log(`   Taux de conversion     : ${stats.conversionRate}%`);
                console.log(`   Montant moyen          : ${stats.averageAmount} FCFA`);
                console.log('='.repeat(60) + '\n');

                return res.status(200).json({ success: true, stats });
            } catch (error: any) {
                return res.status(500).json({ success: false, message: error.message });
            }
        });

        /**
         * @swagger
         * /api/webhook/waiting:
         *   get:
         *     summary: Transactions en attente (initiated + pending)
         *     tags: [Webhook]
         *     responses:
         *       200:
         *         description: Liste des transactions en attente
         */
        this.router.get('/waiting', async (_req: Request, res: Response) => {
            try {
                const initiated = await this.transactionDbService.getByStatus('initiated');
                const pending = await this.transactionDbService.getByStatus('pending');
                const allWaiting = [...initiated, ...pending].sort(
                    (a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime(),
                );

                // Afficher dans la console
                console.log('\n' + '═'.repeat(80));
                console.log('⏳ TRANSACTIONS EN ATTENTE (Initiées + Pending)');
                console.log('═'.repeat(80));

                if (allWaiting.length === 0) {
                    console.log('   ✅ Aucune transaction en attente');
                } else {
                    console.log(`   📊 Total: ${allWaiting.length} transaction(s)`);
                    console.log(`      - Initiées: ${initiated.length}`);
                    console.log(`      - Pending: ${pending.length}`);
                    console.log('─'.repeat(80));

                    for (const tx of allWaiting) {
                        const typeLabel = this.getTypeLabel(tx.type);
                        const statusEmoji = this.getStatusEmoji(tx.status);
                        const date = new Date(tx.initiatedAt).toLocaleString('fr-FR');
                        console.log(
                            `   ${statusEmoji} [${typeLabel}] ${tx.reference.substring(0, 20)}... | ${tx.amount} FCFA | ${tx.payerFirstName} ${tx.payerLastName} | ${date}`,
                        );
                    }
                }

                console.log('═'.repeat(80) + '\n');

                return res.status(200).json({
                    success: true,
                    count: allWaiting.length,
                    initiated: initiated.length,
                    pending: pending.length,
                    transactions: allWaiting,
                });
            } catch (error: any) {
                return res.status(500).json({ success: false, message: error.message });
            }
        });

        /**
         * @swagger
         * /api/webhook/summary:
         *   get:
         *     summary: Résumé rapide des transactions
         *     tags: [Webhook]
         *     responses:
         *       200:
         *         description: Résumé des transactions avec les 5 dernières
         */
        this.router.get('/summary', async (_req: Request, res: Response) => {
            try {
                const stats = await this.transactionDbService.getStats();
                const recent = await this.transactionDbService.getRecentTransactions(5);

                console.log('\n' + '╔'.padEnd(79, '═') + '╗');
                console.log('║' + ' 📊 RÉSUMÉ DES TRANSACTIONS '.padStart(45).padEnd(78) + '║');
                console.log('╠'.padEnd(79, '═') + '╣');
                console.log(`║  Total: ${stats.total.toString().padEnd(10)} | ✅ ${stats.byStatus.completed} | ⏳ ${stats.byStatus.pending + stats.byStatus.initiated} | ❌ ${stats.byStatus.failed}`.padEnd(78) + '║');
                console.log(`║  Montant encaissé: ${stats.completedAmount} FCFA`.padEnd(78) + '║');
                console.log(`║  Taux de conversion: ${stats.conversionRate}%`.padEnd(78) + '║');
                console.log('╠'.padEnd(79, '═') + '╣');
                console.log('║' + ' 🕐 5 DERNIÈRES TRANSACTIONS '.padStart(45).padEnd(78) + '║');
                console.log('╠'.padEnd(79, '═') + '╣');

                for (const tx of recent) {
                    const emoji = this.getStatusEmoji(tx.status);
                    const line = `║  ${emoji} ${tx.reference.substring(0, 15)}... | ${tx.amount} FCFA | ${tx.status}`;
                    console.log(line.padEnd(78) + '║');
                }

                console.log('╚'.padEnd(79, '═') + '╝\n');

                return res.status(200).json({
                    success: true,
                    stats,
                    recentTransactions: recent,
                });
            } catch (error: any) {
                return res.status(500).json({ success: false, message: error.message });
            }
        });

        /**
         * @swagger
         * /api/webhook/reconcile:
         *   post:
         *     summary: Force une réconciliation manuelle des transactions en attente
         *     tags: [Webhook]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Réconciliation terminée
         *       401:
         *         description: Non autorisé
         */
        this.router.post('/reconcile', authenticateToken, async (_req: Request, res: Response) => {
            try {
                const result = await this.reconciliationService.forceReconciliation();
                return res.status(200).json({
                    success: true,
                    message: 'Réconciliation terminée',
                    ...result,
                });
            } catch (error: any) {
                return res.status(500).json({ success: false, message: error.message });
            }
        });
    }
}
