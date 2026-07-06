import { TransactionModel } from '@app/models/transaction.model';
import { Transaction, TransactionStatus, TransactionType } from '@common/interfaces/transaction';
import { Service } from 'typedi';

@Service()
export class TransactionDatabaseService {
    async create(transaction: Transaction): Promise<Transaction> {
        const doc = new TransactionModel(transaction);
        await doc.save();

        // Log détaillé de la création
        const typeLabel = transaction.type === 'donation' ? 'Don' : transaction.type === 'membership' ? 'Adhésion' : 'Commande';
        console.log('\n' + '─'.repeat(60));
        console.log(`📝 NOUVELLE TRANSACTION ENREGISTRÉE`);
        console.log('─'.repeat(60));
        console.log(`   Type        : ${typeLabel}`);
        console.log(`   Référence   : ${transaction.reference}`);
        console.log(`   Montant     : ${transaction.amount} FCFA`);
        console.log(`   Payeur      : ${transaction.payerFirstName} ${transaction.payerLastName}`);
        console.log(`   Email       : ${transaction.payerEmail}`);
        console.log(`   Téléphone   : ${transaction.payerPhone}`);
        console.log(`   Statut      : 🔄 ${transaction.status}`);
        console.log('─'.repeat(60) + '\n');

        return transaction;
    }

    async getAll(): Promise<Transaction[]> {
        return TransactionModel.find().sort({ initiatedAt: -1 }).lean();
    }

    async getById(id: string): Promise<Transaction | null> {
        return TransactionModel.findOne({ id }).lean();
    }

    async getByReference(reference: string): Promise<Transaction | null> {
        return TransactionModel.findOne({ reference }).lean();
    }

    async getByEntityId(entityId: string): Promise<Transaction[]> {
        return TransactionModel.find({ entityId }).sort({ initiatedAt: -1 }).lean();
    }

    async getByType(type: TransactionType): Promise<Transaction[]> {
        return TransactionModel.find({ type }).sort({ initiatedAt: -1 }).lean();
    }

    async getByStatus(status: TransactionStatus): Promise<Transaction[]> {
        return TransactionModel.find({ status }).sort({ initiatedAt: -1 }).lean();
    }

    async updateStatus(
        reference: string,
        status: TransactionStatus,
        additionalData?: Partial<Transaction>,
    ): Promise<Transaction | null> {
        const updateData: Partial<Transaction> = {
            status,
            ...additionalData,
        };

        if (status === 'completed') {
            updateData.completedAt = new Date().toISOString();
        }

        const updated = await TransactionModel.findOneAndUpdate({ reference }, { $set: updateData }, { new: true }).lean();

        if (updated) {
            const statusEmoji =
                status === 'completed' ? '✅' : status === 'failed' ? '❌' : status === 'timeout' ? '⏰' : status === 'cancelled' ? '🚫' : '⏳';
            console.log(`${statusEmoji} Transaction ${reference} → ${status.toUpperCase()}`);
        }

        return updated;
    }

    async updateFromWebhook(
        reference: string,
        singpayData: {
            transactionId?: string;
            status?: string;
            rawResponse?: object;
        },
    ): Promise<Transaction | null> {
        const transaction = await this.getByReference(reference);
        if (!transaction) {
            console.error(`❌ Transaction non trouvée pour webhook: ${reference}`);
            return null;
        }

        const newStatus: TransactionStatus =
            singpayData.status === 'Disbursement' || singpayData.status === 'Success' ? 'completed' : singpayData.status === 'Failed' ? 'failed' : 'pending';

        return this.updateStatus(reference, newStatus, {
            singpayTransactionId: singpayData.transactionId,
            singpayStatus: singpayData.status,
            singpayRawResponse: singpayData.rawResponse,
            webhookReceivedAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
        });
    }

    // Statistiques
    async getStats(): Promise<{
        total: number;
        byStatus: Record<TransactionStatus, number>;
        byType: Record<TransactionType, number>;
        totalAmount: number;
        completedAmount: number;
        conversionRate: number;
        averageAmount: number;
    }> {
        const all = await this.getAll();

        const byStatus = {
            initiated: 0,
            pending: 0,
            completed: 0,
            failed: 0,
            timeout: 0,
            cancelled: 0,
        };

        const byType = {
            donation: 0,
            membership: 0,
            product: 0,
        };

        let totalAmount = 0;
        let completedAmount = 0;

        for (const tx of all) {
            byStatus[tx.status]++;
            byType[tx.type]++;
            totalAmount += tx.amount;
            if (tx.status === 'completed') {
                completedAmount += tx.amount;
            }
        }

        const initiated = byStatus.initiated + byStatus.pending + byStatus.completed + byStatus.failed;
        const conversionRate = initiated > 0 ? (byStatus.completed / initiated) * 100 : 0;
        const averageAmount = all.length > 0 ? totalAmount / all.length : 0;

        return {
            total: all.length,
            byStatus,
            byType,
            totalAmount,
            completedAmount,
            conversionRate: Math.round(conversionRate * 100) / 100,
            averageAmount: Math.round(averageAmount),
        };
    }

    async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
        return TransactionModel.find().sort({ initiatedAt: -1 }).limit(limit).lean();
    }
}
