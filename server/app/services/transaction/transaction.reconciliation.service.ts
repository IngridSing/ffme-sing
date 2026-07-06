import { TransactionDatabaseService } from '@app/services/database/transaction/transaction.database.service';
import { DonationService } from '@app/services/donation/donation.service';
import { MembershipService } from '@app/services/membership/membership.service';
import { SingPayService } from '@app/services/singpay/singpay.service';
import { Service } from 'typedi';

@Service()
export class TransactionReconciliationService {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(
        private readonly transactionDbService: TransactionDatabaseService,
        private readonly singPayService: SingPayService,
        private readonly donationService: DonationService,
        private readonly membershipService: MembershipService,
    ) {}

    /**
     * Démarre le service de réconciliation
     * - Exécute une vérification immédiate au démarrage
     * - Lance un intervalle pour vérifier périodiquement
     */
    async start(intervalMinutes: number = 5): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Service de réconciliation déjà en cours');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Démarrage du service de réconciliation des transactions...');

        // Exécution immédiate au démarrage
        await this.reconcilePendingTransactions();

        // Puis toutes les X minutes
        this.intervalId = setInterval(
            async () => {
                await this.reconcilePendingTransactions();
            },
            intervalMinutes * 60 * 1000,
        );

        console.log(`✅ Service de réconciliation activé (vérification toutes les ${intervalMinutes} minutes)`);
    }

    /**
     * Arrête le service de réconciliation
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('🛑 Service de réconciliation arrêté');
    }

    /**
     * Vérifie et réconcilie toutes les transactions en attente
     */
    async reconcilePendingTransactions(): Promise<{ checked: number; reconciled: number; failed: number }> {
        console.log('🔄 Vérification des transactions en attente...');

        const stats = { checked: 0, reconciled: 0, failed: 0 };

        try {
            // Récupérer les transactions "initiated" ou "pending"
            const [initiated, pending] = await Promise.all([
                this.transactionDbService.getByStatus('initiated'),
                this.transactionDbService.getByStatus('pending'),
            ]);

            const pendingTransactions = [...initiated, ...pending];

            if (pendingTransactions.length === 0) {
                console.log('✅ Aucune transaction en attente');
                return stats;
            }

            console.log(`📋 ${pendingTransactions.length} transaction(s) à vérifier`);

            for (const transaction of pendingTransactions) {
                stats.checked++;

                try {
                    // Vérifier le statut auprès de Singpay
                    const singpayResult = await this.singPayService.getTransactionByReference(transaction.reference);

                    if (!singpayResult.success) {
                        console.log(`⏳ Transaction ${transaction.reference}: pas encore de réponse Singpay`);
                        continue;
                    }

                    const status = singpayResult.status;
                    const result = singpayResult.raw?.result;

                    // Vérifier si le paiement est confirmé
                    const isSuccess = status === 'Disbursement' || (status === 'Terminate' && result !== 'TimeOutError' && result !== 'Failed');
                    const isFailed = status === 'Failed' || result === 'Failed';
                    const isTimeout = result === 'TimeOutError';

                    if (isSuccess) {
                        // Mettre à jour la transaction
                        await this.transactionDbService.updateStatus(transaction.reference, 'completed', {
                            singpayStatus: status,
                            singpayRawResponse: singpayResult.raw,
                            verifiedAt: new Date().toISOString(),
                        });

                        // Finaliser l'entité associée
                        if (transaction.type === 'donation') {
                            await this.donationService.finalizeFromWebhook(transaction.entityId);
                        } else if (transaction.type === 'membership') {
                            await this.membershipService.finalizeFromWebhook(transaction.entityId);
                        }

                        console.log(`✅ Transaction ${transaction.reference} réconciliée avec succès`);
                        stats.reconciled++;
                    } else if (isFailed || isTimeout) {
                        // Marquer comme échouée
                        await this.transactionDbService.updateStatus(transaction.reference, isFailed ? 'failed' : 'timeout', {
                            singpayStatus: status,
                            singpayRawResponse: singpayResult.raw,
                            verifiedAt: new Date().toISOString(),
                        });

                        console.log(`❌ Transaction ${transaction.reference} marquée comme ${isFailed ? 'échouée' : 'expirée'}`);
                        stats.failed++;
                    }
                } catch (error: any) {
                    console.error(`❌ Erreur vérification transaction ${transaction.reference}:`, error.message);
                }
            }

            console.log(`📊 Réconciliation terminée: ${stats.checked} vérifiées, ${stats.reconciled} réconciliées, ${stats.failed} échouées`);
        } catch (error: any) {
            console.error('❌ Erreur lors de la réconciliation:', error.message);
        }

        return stats;
    }

    /**
     * Force une réconciliation manuelle
     */
    async forceReconciliation(): Promise<{ checked: number; reconciled: number; failed: number }> {
        console.log('🔧 Réconciliation manuelle forcée...');
        return this.reconcilePendingTransactions();
    }
}
