import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { PaymentMethod } from '@common/enums/payment-method';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class MembershipCommunicationService {
    private readonly baseUrl = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    postMembership(data: FormData): Observable<any> {
        return this.http.post(`${this.baseUrl}${ApiEndpoints.MEMBERSHIP}`, data);
    }

    getMembershipExists(id: string): Observable<{ exists: boolean }> {
        return this.http.get<{ exists: boolean }>(`${this.baseUrl}${ApiEndpoints.MEMBERSHIP}${id}/exists`);
    }

    postMembershipPayment(id: string, paymentMethod: PaymentMethod, montant: number): Observable<any> {
        return this.http.post(`${this.baseUrl}${ApiEndpoints.MEMBERSHIP}${id}/payment`, {
            paymentMethod,
            montant,
        });
    }

    verifyPayment(id: string): Observable<{ success: boolean; message: string }> {
        return this.http.get<{ success: boolean; message: string }>(
            `${this.baseUrl}${ApiEndpoints.MEMBERSHIP}payment/verify/${id}`,
        );
    }
}
