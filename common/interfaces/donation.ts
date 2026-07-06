import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';

export interface Donation {
    idDonation: string;
    projectMotivation: string; //à modifier
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    amount: number;
    isPaid: PaymentStatus;
    paymentMethod: PaymentMethod;
    registrationDate: string;
}
