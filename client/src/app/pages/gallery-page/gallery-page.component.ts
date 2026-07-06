import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';
import { FooterComponent } from '@app/components/footer/footer.component';
import { GalleryCommunicationService } from '@app/services/communication/gallery/gallery.communication.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { GalleryEventSummary } from '@common/interfaces/gallery-meta';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface DisplayPhoto {
    imageUrl: string;
    eventName: string;
    description: string;
    imageId: string;
    loaded: boolean;
}

@Component({
    selector: 'app-gallery-page',
    standalone: true,
    imports: [CommonModule, FormsModule, NavbarComponent, TitleComponent, FooterComponent],
    templateUrl: './gallery-page.component.html',
    styleUrl: './gallery-page.component.scss',
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
})
export class GalleryPageComponent extends BaseDestroyableComponent implements OnInit, OnDestroy {
    readonly pageSize = 6;

    photosToDisplay: DisplayPhoto[] = [];
    eventSummaries: GalleryEventSummary[] = [];
    totalPhotos = 0;

    selectedEvent: string | null = null;
    searchQuery = '';

    currentPage = 1;
    totalPages = 1;
    filteredTotal = 0;

    isLoading = true;
    isLoadingPage = false;

    lightboxOpen = false;
    currentIndex = 0;

    private readonly searchChanges$ = new Subject<string>();
    private touchStartX = 0;
    private touchEndX = 0;

    constructor(
        private galleryCommService: GalleryCommunicationService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        document.body.classList.add('gallery-page');

        this.searchChanges$
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe(() => {
                this.currentPage = 1;
                this.loadPhotos();
            });

        this.loadMeta();
        this.loadPhotos();
    }

    override ngOnDestroy(): void {
        super.ngOnDestroy();
        document.body.classList.remove('gallery-page');
        this.closeLightbox();
    }

    get events(): string[] {
        return this.eventSummaries.map((e) => e.eventName);
    }

    getEventCount(eventName: string): number {
        return this.eventSummaries.find((e) => e.eventName === eventName)?.count ?? 0;
    }

    selectEvent(event: string | null): void {
        this.selectedEvent = event;
        this.currentPage = 1;
        this.loadPhotos();
    }

    onSearchChange(): void {
        this.searchChanges$.next(this.searchQuery);
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.currentPage = 1;
        this.loadPhotos();
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadPhotos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    get pageNumbers(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    private loadMeta(): void {
        this.galleryCommService.getMeta()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (meta) => {
                    this.eventSummaries = meta.events;
                    this.totalPhotos = meta.total;
                    this.cdr.detectChanges();
                },
                error: () => console.error('Erreur chargement meta galerie'),
            });
    }

    private loadPhotos(): void {
        this.isLoadingPage = true;
        if (this.currentPage === 1 && this.photosToDisplay.length === 0) {
            this.isLoading = true;
        }

        this.galleryCommService.getPhotos({
            page: this.currentPage,
            limit: this.pageSize,
            eventName: this.selectedEvent,
            search: this.searchQuery,
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.filteredTotal = response.total;
                    this.totalPages = response.totalPages;
                    this.currentPage = response.page;

                    this.photosToDisplay = response.data.map((photo) => ({
                        imageId: photo.image,
                        imageUrl: this.galleryCommService.getImageStream(photo.image),
                        eventName: photo.eventName,
                        description: photo.description,
                        loaded: false,
                    }));

                    this.isLoading = false;
                    this.isLoadingPage = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.isLoadingPage = false;
                    this.cdr.detectChanges();
                    console.error('Erreur chargement galerie');
                },
            });
    }

    onImageLoad(photo: DisplayPhoto): void {
        photo.loaded = true;
    }

    get currentLightboxPhoto(): DisplayPhoto | null {
        return this.photosToDisplay[this.currentIndex] || null;
    }

    openLightbox(index: number): void {
        this.currentIndex = index;
        this.lightboxOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeLightbox(): void {
        this.lightboxOpen = false;
        document.body.style.overflow = '';
    }

    prevPhoto(): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.photosToDisplay.length - 1;
        }
    }

    nextPhoto(): void {
        if (this.currentIndex < this.photosToDisplay.length - 1) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
        }
    }

    goToPhoto(index: number): void {
        this.currentIndex = index;
    }

    @HostListener('document:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent): void {
        if (!this.lightboxOpen) return;

        switch (event.key) {
            case 'Escape':
                this.closeLightbox();
                break;
            case 'ArrowLeft':
                this.prevPhoto();
                break;
            case 'ArrowRight':
                this.nextPhoto();
                break;
        }
    }

    @HostListener('touchstart', ['$event'])
    onTouchStart(event: TouchEvent): void {
        if (!this.lightboxOpen) return;
        this.touchStartX = event.changedTouches[0].screenX;
    }

    @HostListener('touchend', ['$event'])
    onTouchEnd(event: TouchEvent): void {
        if (!this.lightboxOpen) return;
        this.touchEndX = event.changedTouches[0].screenX;
        this.handleSwipe();
    }

    private handleSwipe(): void {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextPhoto();
            } else {
                this.prevPhoto();
            }
        }
    }
}
