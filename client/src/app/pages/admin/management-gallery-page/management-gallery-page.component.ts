import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormPhotoComponent } from '@app/components/admin/form-photo/form-photo.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { GalleryPhoto } from '@common/interfaces/gallery-photo';
import { takeUntil } from 'rxjs/operators';
import { AdminSidebarComponent } from '../../../components/admin/admin-sidebar/admin-sidebar.component';

@Component({
    selector: 'app-management-gallery-page',
    standalone: true,
    imports: [CommonModule, AdminSidebarComponent, LoadingSpinnerComponent, FormPhotoComponent],
    templateUrl: './management-gallery-page.component.html',
    styleUrl: './management-gallery-page.component.scss',
})
export class ManagementGalleryPageComponent extends BaseDestroyableComponent implements OnInit {
    allPhotos: GalleryPhoto[] = [];
    imageLoadedMap: Record<string, boolean> = {};
    selectedPhoto: GalleryPhoto | null = null;
    showModal = false;
    photoToEdit: GalleryPhoto | null = null;
    isEditMode = false;
    eventFolders: { [eventName: string]: GalleryPhoto[] } = {};
    selectedEvent: string | null = null;
    imageCache: Map<string, string> = new Map();
    readonly MAX_CACHE_SIZE = 100;
    objectKeys = Object.keys;
    isLoading: boolean = false;

    constructor(
        private adminCommService: AdminCommunicationService,
        private cdr: ChangeDetectorRef,
        private notificationService: NotificationService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.loadGallery();
    }

    loadGallery(): void {
        this.isLoading = true;
        this.adminCommService.getAllGalleryPhotos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photos: GalleryPhoto[]) => {
                    this.allPhotos = photos;
                    this.groupPhotosByEvent();
                    for (const photo of photos) {
                        const url = this.getImageWithCache(photo.image);
                        this.imageCache.set(photo.image, url);
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.notificationService.error('Erreur lors du chargement de la galerie.');
                },
            });
    }

    onImageLoad(imageId: string): void {
        this.imageLoadedMap[imageId] = true;
    }

    groupPhotosByEvent(): void {
        this.eventFolders = {};
        for (const photo of this.allPhotos) {
            const event = photo.eventName || 'Sans évènement';
            if (!this.eventFolders[event]) {
                this.eventFolders[event] = [];
            }
            this.eventFolders[event].push(photo);
        }
    }

    handlePhotoDelete(photoId: string) {
        this.isLoading = true;
        this.adminCommService.deleteGalleryPhoto(photoId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.allPhotos = this.allPhotos.filter((p) => p._id !== photoId);
                    this.groupPhotosByEvent();
                    this.showModal = false;
                    this.isLoading = false;
                    this.notificationService.success('Photo supprimée avec succès.');
                },
                error: () => {
                    this.isLoading = false;
                    this.notificationService.error('Erreur lors de la suppression.');
                },
            });
    }

    openForm(): void {
        this.photoToEdit = null;
        this.isEditMode = false;
        this.showModal = true;
    }

    editPhoto(photo: GalleryPhoto): void {
        this.photoToEdit = photo;
        this.isEditMode = true;
        this.showModal = true;
    }

    closeForm(): void {
        this.showModal = false;
    }

    handleFormSubmit(formData: FormData): void {
        this.isLoading = true;
        this.showModal = false;

        if (this.isEditMode && this.photoToEdit?._id) {
            const updatePayload = {
                eventName: formData.get('eventName') as string,
                description: formData.get('description') as string,
            };

            this.adminCommService.updateGalleryPhoto(this.photoToEdit._id, updatePayload)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updatedPhoto: GalleryPhoto) => {
                        const index = this.allPhotos.findIndex((p) => p._id === this.photoToEdit?._id);
                        if (index !== -1) {
                            this.allPhotos[index] = updatedPhoto;
                        }
                        this.groupPhotosByEvent();
                        this.isLoading = false;
                        this.notificationService.success('Photo mise à jour avec succès.');
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error('Erreur mise à jour photo:', err);
                        this.isLoading = false;
                        this.notificationService.error('Erreur lors de la mise à jour.');
                        this.cdr.detectChanges();
                    },
                });
        } else {
            this.notificationService.info('Upload en cours, veuillez patienter...');

            this.adminCommService.postGalleryPhoto(formData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (newPhotos: GalleryPhoto[]) => {
                        this.allPhotos.push(...newPhotos);
                        this.groupPhotosByEvent();
                        for (const photo of newPhotos) {
                            const url = this.getImageWithCache(photo.image);
                            this.imageCache.set(photo.image, url);
                        }
                        this.isLoading = false;
                        this.notificationService.success(`${newPhotos.length} photo(s) ajoutée(s) avec succès.`);
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error('Erreur upload photo:', err);
                        this.isLoading = false;
                        this.notificationService.error(`Erreur lors de l'upload: ${err?.error?.message || err?.message || 'Erreur inconnue'}`);
                        this.cdr.detectChanges();
                    },
                });
        }
    }

    selectEvent(evt: string) {
        this.selectedEvent = evt;
    }

    deleteEvent(eventName: string): void {
        const photoCount = this.eventFolders[eventName]?.length || 0;
        const confirmDelete = confirm(`Supprimer l'evenement "${eventName}" et ses ${photoCount} photo(s) ?`);

        if (!confirmDelete) return;

        this.isLoading = true;
        this.adminCommService.deleteGalleryEvent(eventName)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.notificationService.success(result.message);
                    // Recharger toute la galerie
                    this.loadGallery();
                    // Reinitialiser la selection
                    if (this.selectedEvent === eventName) {
                        this.selectedEvent = null;
                    }
                },
                error: (err) => {
                    console.error('Erreur suppression evenement:', err);
                    this.isLoading = false;
                    this.notificationService.error('Erreur lors de la suppression de l\'evenement');
                    this.cdr.detectChanges();
                },
            });
    }

    getImageWithCache(fileName: string): string {
        if (this.imageCache.has(fileName)) {
            return this.imageCache.get(fileName)!;
        }

        const imageUrl = this.adminCommService.getImageStream(fileName);
        this.imageCache.set(fileName, imageUrl);

        if (this.imageCache.size > this.MAX_CACHE_SIZE) {
            const oldestKey = this.imageCache.keys().next().value;
            if (oldestKey) this.imageCache.delete(oldestKey);
        }

        return imageUrl;
    }
}
