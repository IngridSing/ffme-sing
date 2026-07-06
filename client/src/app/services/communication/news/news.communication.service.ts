import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { News } from '@common/interfaces/news';
import { PaginatedResponse } from '@common/interfaces/paginated-response';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface NewsQueryParams {
    page?: number;
    limit?: number;
}

@Injectable({
    providedIn: 'root',
})
export class NewsControllerService {
    private readonly baseUrl = `${environment.serverUrl}${ApiEndpoints.NEWS}`;

    constructor(private http: HttpClient) {}

    getNews(params: NewsQueryParams = {}): Observable<PaginatedResponse<News>> {
        const httpParams = new HttpParams()
            .set('page', String(params.page ?? 1))
            .set('limit', String(params.limit ?? 6));

        return this.http.get<PaginatedResponse<News>>(`${this.baseUrl}`, { params: httpParams });
    }

    getNewsById(id: string): Observable<News> {
        return this.http.get<News>(`${this.baseUrl}${id}`, {});
    }

    getImageUrl(filename: string): string {
        return `${this.baseUrl}image/${encodeURIComponent(filename)}`;
    }
}
