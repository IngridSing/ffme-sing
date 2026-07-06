import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiEndpoints } from '@common/enums/api-endpoints';
import { Video } from '@common/interfaces/video';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class VideoControllerService {
    private readonly baseUrl = `${environment.serverUrl}${ApiEndpoints.VIDEO}`;

    constructor(private http: HttpClient) {}

    getAllVideos(): Observable<Video[]> {
        return this.http.get<Video[]>(this.baseUrl);
    }

    getVideoById(id: string): Observable<Video> {
        return this.http.get<Video>(`${this.baseUrl}${id}`);
    }
}
