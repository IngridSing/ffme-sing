import { PaymentMethod } from '@common/enums/payment-method';
import { Transaction, TransactionStatus, TransactionType } from '@common/interfaces/transaction';
import { Schema, model } from 'mongoose';

const TransactionSchema = new Schema<Transaction>({
    id: { type: String, required: true },
    type: { type: String, enum: ['donation', 'membership', 'product'] as TransactionType[], required: true },
    entityId: { type: String, required: true },
    reference: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'completed', 'failed', 'timeout', 'cancelled'] as TransactionStatus[],
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: [PaymentMethod.SING_PAY, PaymentMethod.RIB, PaymentMethod.PICK_UP, PaymentMethod.NONE],
        required: true,
    },

    // Infos payeur
    payerFirstName: { type: String, required: true },
    payerLastName: { type: String, required: true },
    payerPhone: { type: String, required: true },
    payerEmail: { type: String, required: true },

    // Infos Singpay
    singpayTransactionId: { type: String },
    singpayStatus: { type: String },
    singpayRawResponse: { type: Schema.Types.Mixed },

    // Timestamps
    initiatedAt: { type: String, required: true },
    completedAt: { type: String },
    verifiedAt: { type: String },
    webhookReceivedAt: { type: String },
});

// Index pour recherches rapides
TransactionSchema.index({ id: 1 }, { unique: true });
TransactionSchema.index({ reference: 1 }, { unique: true });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ entityId: 1 });
TransactionSchema.index({ initiatedAt: -1 });
TransactionSchema.index({ payerEmail: 1 });

export const TransactionModel = model<Transaction>('Transaction', TransactionSchema);
