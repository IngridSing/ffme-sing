import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { DashboardStats } from '@common/interfaces/dashboard-stats';
import { Donation } from '@common/interfaces/donation';
import { GalleryPhoto } from '@common/interfaces/gallery-photo';
import { Member } from '@common/interfaces/member';
import { News } from '@common/interfaces/news';
import { Video } from '@common/interfaces/video';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdminCommunicationService {
    private readonly baseUrl: string = `${environment.serverUrl}${ApiEndpoints.ADMIN}`;

    constructor(private readonly http: HttpClient) {}

    postLoginAdmin(data: { email: string; password: string }): Observable<{ success: boolean; token?: string; message?: string }> {
        return this.http.post<{ success: boolean; token?: string; message?: string }>(`${this.baseUrl}login`, data, {
            withCredentials: true,
        });
    }

    // Dashboard Stats
    getStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.baseUrl}stats`, { headers: this.getAuthHeaders() });
    }

    // Chart Data for Dashboard
    getChartData(): Observable<{ labels: string[]; donations: number[]; members: number[]; amounts: number[] }> {
        return this.http.get<{ labels: string[]; donations: number[]; members: number[]; amounts: number[] }>(
            `${this.baseUrl}stats/charts`,
            { headers: this.getAuthHeaders() },
        );
    }

    // Membres
    getAllMembers(): Observable<Member[]> {
        return this.http.get<Member[]>(`${this.baseUrl}members`, { headers: this.getAuthHeaders() });
    }

    getMemberById(id: string): Observable<Member> {
        return this.http.get<Member>(`${this.baseUrl}member/${id}`, { headers: this.getAuthHeaders() });
    }

    getProtectedDocumentStream(membershipId: string, type: string, filename: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}member/${membershipId}/documents/${type}/${encodeURIComponent(filename)}`, {
            headers: this.getAuthHeaders(),
            responseType: 'blob',
        });
    }

    getDocumentStreamById(fileId: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}member/document/${fileId}`, {
            headers: this.getAuthHeaders(),
            responseType: 'blob',
        });
    }

    updatePaymentStatus(id: string, status: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.baseUrl}member/${id}/status`, { status }, { headers: this.getAuthHeaders() });
    }

    updateValidation(id: string, isValidated: boolean): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.baseUrl}member/${id}/validation`, { isValidated }, { headers: this.getAuthHeaders() });
    }

    deleteMember(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}member/${id}`, { headers: this.getAuthHeaders() });
    }

    // Donation
    getAllDonations(): Observable<Donation[]> {
        return this.http.get<Donation[]>(`${this.baseUrl}donations`, {
            headers: this.getAuthHeaders(),
        });
    }

    getDonationById(id: string): Observable<Donation> {
        return this.http.get<Donation>(`${this.baseUrl}donation/${id}`, {
            headers: this.getAuthHeaders(),
        });
    }

    updateDonationStatus(id: string, status: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.baseUrl}donation/${id}/status`, { status }, { headers: this.getAuthHeaders() });
    }

    // Gallery
    getAllGalleryPhotos(): Observable<GalleryPhoto[]> {
        return this.http.get<GalleryPhoto[]>(`${this.baseUrl}gallery`, {
            headers: this.getAuthHeaders(),
        });
    }

    getGalleryPhotoById(id: string): Observable<GalleryPhoto> {
        return this.http.get<GalleryPhoto>(`${this.baseUrl}gallery/${id}`, {
            headers: this.getAuthHeaders(),
        });
    }

    getGalleryPhotoStream(filename: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}gallery/image/${filename}`, {
            headers: this.getAuthHeaders(),
            responseType: 'blob',
        });
    }

    getImageStream(filename: string): string {
        return `${this.baseUrl}gallery/image/${encodeURIComponent(filename)}`;
    }

    postGalleryPhoto(formData: FormData): Observable<GalleryPhoto[]> {
        return this.http.post<GalleryPhoto[]>(`${this.baseUrl}gallery`, formData, { headers: this.getAuthHeaders() });
    }

    updateGalleryPhoto(id: string, data: Partial<GalleryPhoto>): Observable<GalleryPhoto> {
        return this.http.put<GalleryPhoto>(`${this.baseUrl}gallery/${id}`, data, { headers: this.getAuthHeaders() });
    }

    deleteGalleryPhoto(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}gallery/${id}`, { headers: this.getAuthHeaders() });
    }

    deleteGalleryEvent(eventName: string): Observable<{ success: boolean; message: string; deletedCount: number }> {
        return this.http.delete<{ success: boolean; message: string; deletedCount: number }>(
            `${this.baseUrl}gallery/event/${encodeURIComponent(eventName)}`,
            { headers: this.getAuthHeaders() },
        );
    }

    // News
    getAllNews(): Observable<News[]> {
        return this.http.get<News[]>(`${this.baseUrl}news`, {
            headers: this.getAuthHeaders(),
        });
    }

    getNewsById(id: string): Observable<News> {
        return this.http.get<News>(`${this.baseUrl}news/${id}`, {
            headers: this.getAuthHeaders(),
        });
    }

    getNewsImageStream(filename: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}news/image/${filename}`, {
            headers: this.getAuthHeaders(),
            responseType: 'blob',
        });
    }

    getNewsImageUrl(filename: string): string {
        return `${this.baseUrl}news/image/${encodeURIComponent(filename)}`;
    }

    postNews(formData: FormData): Observable<News> {
        return this.http.post<News>(`${this.baseUrl}news`, formData, {
            headers: this.getAuthHeaders(),
        });
    }

    updateNews(id: string, data: Partial<News>): Observable<News> {
        return this.http.put<News>(`${this.baseUrl}news/${id}`, data, {
            headers: this.getAuthHeaders(),
        });
    }

    deleteNews(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}news/${id}`, {
            headers: this.getAuthHeaders(),
        });
    }

    // Video
    getAllVideos(): Observable<Video[]> {
        return this.http.get<Video[]>(`${this.baseUrl}video`, {
            headers: this.getAuthHeaders(),
        });
    }

    getVideoById(id: string): Observable<Video> {
        return this.http.get<Video>(`${this.baseUrl}video/${id}`, {
            headers: this.getAuthHeaders(),
        });
    }

    postVideo(data: { title: string; description: string; videoUrl: string; date: string }): Observable<Video> {
        return this.http.post<Video>(`${this.baseUrl}video`, data, {
            headers: this.getAuthHeaders(),
        });
    }

    updateVideo(id: string, data: Partial<Video>): Observable<Video> {
        return this.http.put<Video>(`${this.baseUrl}video/${id}`, data, {
            headers: this.getAuthHeaders(),
        });
    }

    toggleVideoActive(id: string): Observable<Video> {
        return this.http.patch<Video>(`${this.baseUrl}video/${id}/toggle`, {}, {
            headers: this.getAuthHeaders(),
        });
    }

    deleteVideo(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}video/${id}`, {
            headers: this.getAuthHeaders(),
        });
    }

    private getAuthHeaders(): HttpHeaders {
        const token = sessionStorage.getItem('adminToken');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
}
