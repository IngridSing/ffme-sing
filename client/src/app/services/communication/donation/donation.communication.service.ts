import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { PaymentMethod } from '@common/enums/payment-method';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class DonationCommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    getDonationExists(id: string): Observable<{ exists: boolean }> {
        return this.http.get<{ exists: boolean }>(`${this.baseUrl}${ApiEndpoints.DONATION}${id}/exists`);
    }

    postDonation(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}${ApiEndpoints.DONATION}`, data, {
            observe: 'response',
        });
        //.pipe(catchError(this.handleError<any>('postDonation')));
    }

    postInitiationSingPay(donId: string): Observable<{ success: boolean; link?: string; message?: string }> {
        return this.http.post<{ success: boolean; link?: string; message?: string }>(`${this.baseUrl}${ApiEndpoints.DONATION}${donId}/singpay`, {});
    }

    postPayment(donId: string, body: { method: PaymentMethod; montant: number }): Observable<any> {
        return this.http.post(`${this.baseUrl}${ApiEndpoints.DONATION}${donId}/payment-others`, body);
    }

    getVerifyPayment(reference: string): Observable<any> {
        const url = `${this.baseUrl}${ApiEndpoints.DONATION}payment/status/${reference}`;
        console.log('Requête GET envoyée à :', url);
        return this.http.get(url);
    }

    verifyPayment(donId: string): Observable<{ success: boolean; message: string }> {
        return this.http.get<{ success: boolean; message: string }>(`${this.baseUrl}${ApiEndpoints.DONATION}payment/verify/${donId}`);
    }

    /*
    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        console.error(`[${request}] Une erreur est survenue`);
        return () => of(result as T);
    }
    */
}
