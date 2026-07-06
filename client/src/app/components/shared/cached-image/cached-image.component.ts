import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ImageCacheService } from '@app/services/image-cache/image-cache.service';

@Component({
    selector: 'app-cached-image',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="cached-image-container" [class.loaded]="isLoaded">
            <div class="skeleton" *ngIf="!isLoaded"></div>
            <img
                [src]="cachedUrl"
                [alt]="alt"
                [class.visible]="isLoaded"
                (load)="onImageLoad()"
                (error)="onImageError()"
            />
        </div>
    `,
    styles: [
        `
            .cached-image-container {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background: #f0f0f0;
            }

            .skeleton {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }

            @keyframes shimmer {
                0% {
                    background-position: 200% 0;
                }
                100% {
                    background-position: -200% 0;
                }
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }

            img.visible {
                opacity: 1;
            }
        `,
    ],
})
export class CachedImageComponent implements OnInit, OnChanges {
    @Input() src: string = '';
    @Input() alt: string = '';
    @Output() loaded = new EventEmitter<void>();
    @Output() error = new EventEmitter<void>();

    cachedUrl: string = '';
    isLoaded: boolean = false;

    constructor(private imageCacheService: ImageCacheService) {}

    ngOnInit(): void {
        this.loadImage();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['src'] && !changes['src'].firstChange) {
            this.loadImage();
        }
    }

    private loadImage(): void {
        if (this.src) {
            this.isLoaded = false; // Reset loading state
            this.cachedUrl = this.imageCacheService.getCachedUrl(this.src);
            this.isLoaded = this.imageCacheService.isLoaded(this.src);
        }
    }

    onImageLoad(): void {
        this.isLoaded = true;
        this.imageCacheService.markAsLoaded(this.src);
        this.loaded.emit();
    }

    onImageError(): void {
        this.isLoaded = true; // Hide skeleton even on error
        this.error.emit();
    }
}
