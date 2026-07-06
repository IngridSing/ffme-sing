// src/app/models/donation.model.ts
import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { Donation } from '@common/interfaces/donation';
import { Schema, model } from 'mongoose';

const DonationSchema = new Schema<Donation>({
    idDonation: { type: String, required: true },
    projectMotivation: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    isPaid: { type: String, enum: [PaymentStatus.COMPLETED, PaymentStatus.FAILURE, PaymentStatus.PENDING], required: true },
    paymentMethod: { type: String, enum: [PaymentMethod.SING_PAY, PaymentMethod.RIB, PaymentMethod.PICK_UP], required: true },
    registrationDate: { type: String, required: true },
});

DonationSchema.index({ isPaid: 1 });
DonationSchema.index({ registrationDate: -1 });
DonationSchema.index({ email: 1 });
DonationSchema.index({ idDonation: 1 }, { unique: true });

export const DonationModel = model<Donation>('Donation', DonationSchema);
