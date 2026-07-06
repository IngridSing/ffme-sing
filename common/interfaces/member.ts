import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { TypeMember } from '@common/enums/type-member';
import { Document } from '@common/interfaces/document';

export interface Member {
    idMember: string;
    typeMember: TypeMember;
    registrationDate: string;
    isValidated: boolean;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    additionalDocuments: Document[]; // array of PDF file paths or buffers
    amount: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
}
