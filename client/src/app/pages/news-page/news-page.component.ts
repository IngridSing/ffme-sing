import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FooterComponent } from '@app/components/footer/footer.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';
import { VideoModalComponent } from '@app/components/video-modal/video-modal.component';
import { NewsControllerService } from '@app/services/communication/news/news.communication.service';
import { VideoControllerService } from '@app/services/communication/video/video.communication.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { News } from '@common/interfaces/news';
import { Video } from '@common/interfaces/video';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-news-page',
    standalone: true,
    imports: [CommonModule, NavbarComponent, TitleComponent, FooterComponent, LoadingSpinnerComponent, VideoModalComponent],
    templateUrl: './news-page.component.html',
    styleUrl: './news-page.component.scss',
})
export class NewsPageComponent extends BaseDestroyableComponent implements OnInit {
    readonly pageSize = 6;

    isLoading = true;
    isLoadingPage = false;
    newsList: News[] = [];
    currentPage = 1;
    totalPages = 1;
    totalNews = 0;
    expandedNews: Set<string> = new Set();

    videosList: Video[] = [];
    showVideoModal = false;
    selectedVideo: Video | null = null;

    constructor(
        private newsService: NewsControllerService,
        private videoService: VideoControllerService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        this.loadNews();
        this.loadVideos();
    }

    get pageNumbers(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    loadNews(): void {
        this.isLoadingPage = true;
        if (this.currentPage === 1 && this.newsList.length === 0) {
            this.isLoading = true;
        }

        this.newsService.getNews({ page: this.currentPage, limit: this.pageSize })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.newsList = response.data;
                    this.totalNews = response.total;
                    this.totalPages = response.totalPages;
                    this.currentPage = response.page;
                    this.isLoading = false;
                    this.isLoadingPage = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.isLoadingPage = false;
                    this.cdr.detectChanges();
                    console.error('Erreur chargement actualites');
                },
            });
    }

    loadVideos(): void {
        this.videoService.getAllVideos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.videosList = data;
                    this.cdr.detectChanges();
                },
                error: () => {
                    console.error('Erreur chargement videos');
                },
            });
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.expandedNews.clear();
        this.loadNews();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getThumbnailUrl(video: Video): string {
        return video.thumbnailUrl ? this.videoService.getThumbnailUrl(video._id) : '';
    }

    openVideoModal(video: Video): void {
        this.selectedVideo = video;
        this.showVideoModal = true;
    }

    closeVideoModal(): void {
        this.showVideoModal = false;
        this.selectedVideo = null;
    }

    formatDate(date: string): string {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    truncate(text: string, maxLength: number): string {
        return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
    }

    toggleExpanded(news: News): void {
        const key = news._id || news.title;
        if (this.expandedNews.has(key)) {
            this.expandedNews.delete(key);
        } else {
            this.expandedNews.add(key);
        }
    }

    getImageUrl(file: string): string {
        return this.newsService.getImageUrl(file);
    }

    isExpanded(news: News): boolean {
        return this.expandedNews.has(news._id || news.title);
    }
}
