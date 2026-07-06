import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { Product } from '@common/interfaces/product';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ProductCommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    postOrderToValidate(data: any): Observable<{ success: boolean; orderId?: string; total?: number; message?: string }> {
        return this.http.post<{ success: boolean; orderId?: string; total?: number; message?: string }>(
            `${this.baseUrl}${ApiEndpoints.PRODUCT}order`,
            data,
        );
    }

    postorderPayment(orderId: string, montant: number, clientData: any) {
        return this.http.post<{
            message: string;
            success: boolean;
            link: string;
        }>(`${this.baseUrl}${ApiEndpoints.PRODUCT}order-payment`, {
            orderId,
            montant,
            ...clientData,
        });
    }

    // postProductOrder(data: any): Observable<{ success: boolean; link?: string; message?: string }> {
    //     return this.http.post<{ success: boolean; link?: string; message?: string }>(`${this.baseUrl}${ApiEndpoints.PRODUCT}`, data);
    // }

    postComment(productId: string, comment: { username: string; content: string; review: number }) {
        return this.http.post(`${this.baseUrl}${ApiEndpoints.PRODUCT}${productId}/comment`, comment);
    }

    getAllProducts(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}${ApiEndpoints.PRODUCT}`);
    }

    getProductById(id: string) {
        return this.http.get<Product>(`${this.baseUrl}${ApiEndpoints.PRODUCT}${id}`);
    }

    getImageStream(filename: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/product/image/${encodeURIComponent(filename)}`, {
            responseType: 'blob',
        });
    }

    getImageUrl(filename: string): string {
        return `${this.baseUrl}${ApiEndpoints.PRODUCT}image/${encodeURIComponent(filename)}`;
    }

    getValidatedCommentsByProductId(productId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}${ApiEndpoints.PRODUCT}${productId}/comments/`);
    }

    verifyPayment(reference: string): Observable<{ success: boolean; message: string }> {
        return this.http.get<{ success: boolean; message: string }>(
            `${this.baseUrl}${ApiEndpoints.PRODUCT}payment/verify/${reference}`,
        );
    }
}
