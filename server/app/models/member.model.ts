import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { TypeMember } from '@common/enums/type-member';
import { Member } from '@common/interfaces/member';
import { Schema, model } from 'mongoose';

const MemberSchema = new Schema<Member>({
    idMember: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    typeMember: { type: String, enum: [TypeMember.ACTIVE, TypeMember.VOLUNTEER], required: true },
    registrationDate: { type: String, required: true },
    additionalDocuments: [
        {
            title: { type: String, required: true },
            path: { type: String, required: true },
        },
    ],
    paymentStatus: { type: String, enum: [PaymentStatus.COMPLETED, PaymentStatus.FAILURE, PaymentStatus.PENDING], required: true },
    paymentMethod: { type: String, enum: [PaymentMethod.SING_PAY, PaymentMethod.RIB, PaymentMethod.PICK_UP], required: true },
    amount: { type: Number, required: true },
    isValidated: { type: Boolean, default: false },
});

MemberSchema.index({ paymentStatus: 1 });
MemberSchema.index({ registrationDate: -1 });
MemberSchema.index({ email: 1 });
MemberSchema.index({ isValidated: 1 });
MemberSchema.index({ idMember: 1 }, { unique: true });

export const MemberModel = model<Member>('Member', MemberSchema);
