import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { Product } from '@common/interfaces/product';
import { ProductOrder } from '@common/interfaces/product-order';
import mongoose, { Schema } from 'mongoose';

const ProductVersionSchema = new Schema({
    label: { type: String, required: true },
    price: { type: Number, required: true },
});

const ProductCommentSchema = new Schema({
    idComment: { type: String, required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    review: { type: Number, required: true },
    isChecked: { type: Boolean, required: true },
});

const productSchema = new Schema<Product>({
    title: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    about: { type: [String], required: true },
    extraLink: {
        label: String,
        url: String,
    },
    image: { type: String, required: true },
    comments: { type: [ProductCommentSchema], default: [] },
    averageReview: { type: Number, required: true },
    versions: { type: [ProductVersionSchema], required: true },
    stock: { type: Number, required: true },
});

productSchema.index({ type: 1 });
productSchema.index({ title: 'text', description: 'text' });

const orderItemSchema = new Schema({
    productId: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    versionLabel: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
});

const productOrderSchema = new Schema<ProductOrder>({
    idOrder: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    isPaid: {
        type: String,
        enum: [PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.FAILURE],
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: [PaymentMethod.SING_PAY, PaymentMethod.RIB, PaymentMethod.PICK_UP],
        required: true,
    },
    date: { type: String, required: true },
    totalAmount: { type: Number, required: true, default: 0 },
    items: { type: [orderItemSchema], default: [] },
    products: { type: [productSchema], required: true },
});

productOrderSchema.index({ isPaid: 1 });
productOrderSchema.index({ date: -1 });
productOrderSchema.index({ idOrder: 1 }, { unique: true });

export const ProductModel = mongoose.model('Product', productSchema);
export const ProductOrderModel = mongoose.model('ProductOrder', productOrderSchema);
