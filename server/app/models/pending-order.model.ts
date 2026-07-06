import mongoose, { Schema } from 'mongoose';

export interface PendingOrderItem {
    productId: string;
    title: string;
    type: string;
    versionLabel: string;
    price: number;
    quantity: number;
}

export interface PendingOrder {
    orderId: string;
    items: PendingOrderItem[];
    totalAmount: number;
    clientData?: {
        prenom: string;
        nom: string;
        numero: string;
        email: string;
    };
    createdAt: Date;
    expiresAt: Date;
}

const PendingOrderItemSchema = new Schema<PendingOrderItem>({
    productId: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    versionLabel: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
});

const pendingOrderSchema = new Schema<PendingOrder>({
    orderId: { type: String, required: true, unique: true },
    items: { type: [PendingOrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    clientData: {
        prenom: String,
        nom: String,
        numero: String,
        email: String,
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

pendingOrderSchema.index({ orderId: 1 });

export const PendingOrderModel = mongoose.model('PendingOrder', pendingOrderSchema);
