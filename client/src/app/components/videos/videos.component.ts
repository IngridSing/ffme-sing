import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VideoModalComponent } from '@app/components/video-modal/video-modal.component';
import { VideoControllerService } from '@app/services/communication/video/video.communication.service';
import { Video } from '@common/interfaces/video';

@Component({
    selector: 'app-videos',
    standalone: true,
    imports: [CommonModule, RouterLink, VideoModalComponent],
    templateUrl: './videos.component.html',
    styleUrls: ['./videos.component.scss'],
})
export class VideosComponent implements OnInit, OnDestroy {
    videosList: Video[] = [];
    currentIndex = 0;
    private intervalId: any;

    // Modal
    showModal = false;
    selectedVideo: Video | null = null;

    constructor(private videoService: VideoControllerService) {}

    ngOnInit(): void {
        this.videoService.getAllVideos().subscribe((data) => {
            this.videosList = data.slice(0, 4);
            if (this.videosList.length > 1) {
                this.intervalId = setInterval(() => this.nextSlide(), 12000);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    getTransform(): string {
        return `translateX(-${this.currentIndex * 100}%)`;
    }

    nextSlide(): void {
        if (this.videosList.length > 0) {
            this.currentIndex = (this.currentIndex + 1) % this.videosList.length;
        }
    }

    prevSlide(): void {
        if (this.videosList.length > 0) {
            this.currentIndex = (this.currentIndex - 1 + this.videosList.length) % this.videosList.length;
        }
    }

    goToSlide(index: number): void {
        this.currentIndex = index;
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    truncate(text: string, max: number): string {
        return text.length > max ? text.slice(0, max) + '...' : text;
    }

    openVideo(video: Video): void {
        this.selectedVideo = video;
        this.showModal = true;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedVideo = null;
        if (this.videosList.length > 1) {
            this.intervalId = setInterval(() => this.nextSlide(), 12000);
        }
    }

    onThumbnailError(event: Event, video: Video): void {
        const img = event.target as HTMLImageElement;
        const videoId = this.extractYoutubeId(video.videoUrl);
        if (!videoId || img.dataset.fallback === 'true') {
            return;
        }
        img.dataset.fallback = 'true';
        img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    private extractYoutubeId(url: string): string | null {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([^?&/]+)/);
        return match?.[1] ?? null;
    }
}
