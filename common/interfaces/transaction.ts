import { PaymentMethod } from '@common/enums/payment-method';

export type TransactionType = 'donation' | 'membership' | 'product';

export type TransactionStatus = 'initiated' | 'pending' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export interface Transaction {
    id: string;
    type: TransactionType;
    entityId: string;
    reference: string;
    amount: number;
    status: TransactionStatus;
    paymentMethod: PaymentMethod;

    // Infos payeur
    payerFirstName: string;
    payerLastName: string;
    payerPhone: string;
    payerEmail: string;

    // Infos Singpay
    singpayTransactionId?: string;
    singpayStatus?: string;
    singpayRawResponse?: object;

    // Timestamps
    initiatedAt: string;
    completedAt?: string;
    verifiedAt?: string;
    webhookReceivedAt?: string;
}
