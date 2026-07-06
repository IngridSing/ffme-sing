import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { GalleryMeta } from '@common/interfaces/gallery-meta';
import { GalleryPhoto } from '@common/interfaces/gallery-photo';
import { PaginatedResponse } from '@common/interfaces/paginated-response';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface GalleryQueryParams {
    page?: number;
    limit?: number;
    eventName?: string | null;
    search?: string;
}

@Injectable({
    providedIn: 'root',
})
export class GalleryCommunicationService {
    private readonly baseUrl: string = `${environment.serverUrl}${ApiEndpoints.GALLERY}`;

    constructor(private readonly http: HttpClient) {}

    getMeta(): Observable<GalleryMeta> {
        return this.http.get<GalleryMeta>(`${this.baseUrl}meta`);
    }

    getPhotos(params: GalleryQueryParams = {}): Observable<PaginatedResponse<GalleryPhoto>> {
        let httpParams = new HttpParams()
            .set('page', String(params.page ?? 1))
            .set('limit', String(params.limit ?? 6));

        if (params.eventName) {
            httpParams = httpParams.set('eventName', params.eventName);
        }

        if (params.search?.trim()) {
            httpParams = httpParams.set('search', params.search.trim());
        }

        return this.http.get<PaginatedResponse<GalleryPhoto>>(`${this.baseUrl}`, { params: httpParams });
    }

    getPhotosByEvent(eventName: string): Observable<GalleryPhoto[]> {
        return this.http.get<GalleryPhoto[]>(`${this.baseUrl}event/${encodeURIComponent(eventName)}`);
    }

    getPhotoById(id: string): Observable<GalleryPhoto> {
        return this.http.get<GalleryPhoto>(`${this.baseUrl}/${id}`);
    }

    getImageStream(fileName: string): string {
        return `${this.baseUrl}image/${encodeURIComponent(fileName)}`;
    }
}
