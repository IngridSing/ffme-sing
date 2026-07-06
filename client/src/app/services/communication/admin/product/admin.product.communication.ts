import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { Product } from '@common/interfaces/product';
import { ProductOrder } from '@common/interfaces/product-order';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdminProductCommunicationService {
    private readonly baseUrl = `${environment.serverUrl}${ApiEndpoints.ADMIN}product`;

    constructor(private readonly http: HttpClient) {}

    // Produits
    getAllProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(`${this.baseUrl}`, { headers: this.getAuthHeaders() });
    }

    getProductById(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    postProduct(formData: FormData): Observable<Product> {
        return this.http.post<Product>(`${this.baseUrl}`, formData, { headers: this.getAuthHeaders() });
    }

    updateProduct(id: string, formData: FormData): Observable<Product> {
        return this.http.put<Product>(`${this.baseUrl}/${id}`, formData, {
            headers: this.getAuthHeaders(),
        });
    }

    deleteProduct(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    // Image
    getImageStream(filename: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/image/${encodeURIComponent(filename)}`, {
            headers: this.getAuthHeaders(),
            responseType: 'blob',
        });
    }

    getImageUrl(filename: string): string {
        return `${this.baseUrl}/image/${encodeURIComponent(filename)}`;
    }

    // Commentaires
    patchProductComment(productId: string, commentId: string, action: 'validate' | 'delete'): Observable<Product> {
        return this.http.patch<Product>(`${this.baseUrl}/${productId}/comment/${commentId}`, { action }, { headers: this.getAuthHeaders() });
    }

    // Commandes
    getAllOrders(): Observable<ProductOrder[]> {
        return this.http.get<ProductOrder[]>(`${this.baseUrl}/orders`, { headers: this.getAuthHeaders() });
    }

    getOrderById(id: string): Observable<ProductOrder> {
        return this.http.get<ProductOrder>(`${this.baseUrl}/order/${id}`, { headers: this.getAuthHeaders() });
    }

    updateOrderStatus(id: string, newStatus: string): Observable<ProductOrder> {
        return this.http.patch<ProductOrder>(`${this.baseUrl}/order/${id}/status`, { newStatus }, { headers: this.getAuthHeaders() });
    }

    private getAuthHeaders(): HttpHeaders {
        const token = sessionStorage.getItem('adminToken');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
}
