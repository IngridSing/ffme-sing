import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminSidebarComponent } from '@app/components/admin/admin-sidebar/admin-sidebar.component';
import { FormNewsComponent } from '@app/components/admin/form-news/form-news.component';
import { FormVideoComponent } from '@app/components/admin/form-video/form-video.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { News } from '@common/interfaces/news';
import { Video } from '@common/interfaces/video';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-management-news-page',
    standalone: true,
    imports: [CommonModule, AdminSidebarComponent, LoadingSpinnerComponent, FormNewsComponent, FormVideoComponent],
    templateUrl: './management-news-page.component.html',
    styleUrl: './management-news-page.component.scss',
})
export class ManagementNewsPageComponent extends BaseDestroyableComponent implements OnInit {
    // Onglet actif
    activeTab: 'news' | 'videos' = 'news';

    // News
    newsList: News[] = [];
    showNewsModal = false;
    isNewsEditMode = false;
    newsToEdit: News | null = null;
    imageCache = new Map<string, string>();

    // Videos
    videosList: Video[] = [];
    showVideoModal = false;
    isVideoEditMode = false;
    videoToEdit: Video | null = null;

    isLoading = false;

    constructor(
        private adminCommService: AdminCommunicationService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        this.loadNews();
        this.loadVideos();
    }

    // === TAB MANAGEMENT ===
    switchTab(tab: 'news' | 'videos'): void {
        this.activeTab = tab;
    }

    getActiveVideosCount(): number {
        return this.videosList.filter(v => v.isActive).length;
    }

    getVideoThumbnailUrl(video: Video): string {
        return video.thumbnailUrl ? this.adminCommService.getVideoThumbnailUrl(video._id) : '';
    }

    // === NEWS METHODS ===
    loadNews(): void {
        this.isLoading = true;
        this.adminCommService.getAllNews()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (news) => {
                    this.newsList = news;
                    for (const n of news) {
                        this.imageCache.set(n.image, this.getImageWithCache(n.image));
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors du chargement des actualites.');
                },
            });
    }

    getImageWithCache(filename: string): string {
        if (this.imageCache.has(filename)) {
            return this.imageCache.get(filename)!;
        }

        const url = this.adminCommService.getNewsImageUrl(filename);
        this.imageCache.set(filename, url);
        return url;
    }

    openNewsForm(): void {
        this.isNewsEditMode = false;
        this.newsToEdit = null;
        this.showNewsModal = true;
    }

    editNews(news: News): void {
        this.newsToEdit = news;
        this.isNewsEditMode = true;
        this.showNewsModal = true;
    }

    closeNewsForm(): void {
        this.showNewsModal = false;
    }

    handleNewsFormSubmit(formData: FormData): void {
        this.isLoading = true;

        if (this.isNewsEditMode && this.newsToEdit?._id) {
            const payload = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                date: formData.get('date') as string,
            };

            this.adminCommService.updateNews(this.newsToEdit._id, payload)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updatedNews: News) => {
                        const index = this.newsList.findIndex((n) => n._id === this.newsToEdit?._id);
                        if (index !== -1) {
                            this.newsList[index] = updatedNews;
                        }
                        this.showNewsModal = false;
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.success('Actualite mise a jour avec succes.');
                    },
                    error: () => {
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.error('Erreur lors de la mise a jour.');
                    },
                });
        } else {
            this.adminCommService.postNews(formData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (newNews: News) => {
                        this.newsList.unshift(newNews);
                        this.imageCache.set(newNews.image, this.getImageWithCache(newNews.image));
                        this.showNewsModal = false;
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.success('Actualite creee avec succes.');
                    },
                    error: () => {
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.error('Erreur lors de la creation.');
                    },
                });
        }
    }

    handleNewsDelete(newsId: string): void {
        this.isLoading = true;

        this.adminCommService.deleteNews(newsId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.newsList = this.newsList.filter((n) => n._id !== newsId);
                    this.showNewsModal = false;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Actualite supprimee avec succes.');
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la suppression.');
                },
            });
    }

    // === VIDEO METHODS ===
    loadVideos(): void {
        this.adminCommService.getAllVideos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (videos) => {
                    this.videosList = videos;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.notificationService.error('Erreur lors du chargement des videos.');
                },
            });
    }

    openVideoForm(): void {
        this.isVideoEditMode = false;
        this.videoToEdit = null;
        this.showVideoModal = true;
    }

    editVideo(video: Video): void {
        this.videoToEdit = video;
        this.isVideoEditMode = true;
        this.showVideoModal = true;
    }

    closeVideoForm(): void {
        this.showVideoModal = false;
    }

    handleVideoFormSubmit(data: { title: string; description: string; videoUrl: string; date: string }): void {
        this.isLoading = true;

        if (this.isVideoEditMode && this.videoToEdit?._id) {
            this.adminCommService.updateVideo(this.videoToEdit._id, data)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updatedVideo: Video) => {
                        const index = this.videosList.findIndex((v) => v._id === this.videoToEdit?._id);
                        if (index !== -1) {
                            this.videosList[index] = updatedVideo;
                        }
                        this.showVideoModal = false;
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.success('Video mise a jour avec succes.');
                    },
                    error: () => {
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.error('Erreur lors de la mise a jour.');
                    },
                });
        } else {
            this.adminCommService.postVideo(data)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (newVideo: Video) => {
                        this.videosList.unshift(newVideo);
                        this.showVideoModal = false;
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.success('Video creee avec succes.');
                    },
                    error: () => {
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.error('Erreur lors de la creation.');
                    },
                });
        }
    }

    handleVideoDelete(videoId: string): void {
        this.isLoading = true;

        this.adminCommService.deleteVideo(videoId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.videosList = this.videosList.filter((v) => v._id !== videoId);
                    this.showVideoModal = false;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Video supprimee avec succes.');
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la suppression.');
                },
            });
    }

    toggleVideoActive(video: Video): void {
        this.adminCommService.toggleVideoActive(video._id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedVideo: Video) => {
                    const index = this.videosList.findIndex((v) => v._id === video._id);
                    if (index !== -1) {
                        this.videosList[index] = updatedVideo;
                    }
                    this.cdr.detectChanges();
                    this.notificationService.success(updatedVideo.isActive ? 'Video activee.' : 'Video desactivee.');
                },
                error: () => {
                    this.notificationService.error('Erreur lors du changement de statut.');
                },
            });
    }
}
