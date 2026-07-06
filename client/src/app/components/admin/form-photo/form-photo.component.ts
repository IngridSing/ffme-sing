import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { GalleryPhoto } from '@common/interfaces/gallery-photo';

@Component({
    selector: 'app-form-photo',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form-photo.component.html',
})
export class FormPhotoComponent {
    @Input() photo: GalleryPhoto | null = null;
    @Input() isEditMode = false;
    @Input() existingEvents: string[] = [];

    @Output() submitted = new EventEmitter<FormData>();
    @Output() closed = new EventEmitter<void>();
    @Output() deleted = new EventEmitter<string>();

    photoForm: FormGroup;
    selectedFiles: File[] = [];
    imageInvalid = false;

    constructor(
        private fb: FormBuilder,
        private adminCommService: AdminCommunicationService,
    ) {
        this.photoForm = this.fb.group({
            eventName: ['', Validators.required],
            description: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        if (this.photo) {
            this.photoForm.patchValue({
                eventName: this.photo.eventName,
                description: this.photo.description,
            });
        }
    }

    getImageUrl(filename: string): string {
        return this.adminCommService.getImageStream(filename);
    }

    onEventSelect(event: Event): void {
        const selectedValue = (event.target as HTMLSelectElement).value;
        if (selectedValue) {
            this.photoForm.patchValue({ eventName: selectedValue });
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFiles = Array.from(input.files);
            this.imageInvalid = false;
        }
    }

    deleteImage(): void {
        if (this.photo && this.photo.image) {
            const confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer cette image ?');
            if (confirmDelete) {
                this.deleted.emit(this.photo._id);
                this.close();
            }
        }
    }

    onSubmit() {
        const { eventName, description } = this.photoForm.value;
        this.photoForm.markAllAsTouched();

        if (!this.photoForm.valid) return;

        if (!this.isEditMode && this.selectedFiles.length === 0) {
            this.imageInvalid = true;
            return;
        }

        const formData = new FormData();
        formData.append('eventName', eventName.trim());
        formData.append('description', description.trim());

        if (!this.isEditMode) {
            for (const file of this.selectedFiles) {
                formData.append('images', file);
            }
        }

        // Emettre les donnees - le parent gere la fermeture du modal
        this.submitted.emit(formData);
    }

    close() {
        this.closed.emit();
    }
}
