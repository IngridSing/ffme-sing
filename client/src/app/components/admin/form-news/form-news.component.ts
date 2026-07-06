import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { News } from '@common/interfaces/news';

@Component({
    selector: 'app-form-news',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form-news.component.html',
})
export class FormNewsComponent {
    @Input() news: News | null = null;
    @Input() isEditMode = false;

    @Output() submitted = new EventEmitter<FormData>();
    @Output() closed = new EventEmitter<void>();
    @Output() deleted = new EventEmitter<string>();

    newsForm: FormGroup;
    selectedFile: File | null = null;
    imageInvalid = false;

    constructor(
        private fb: FormBuilder,
        private adminCommService: AdminCommunicationService,
    ) {
        this.newsForm = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            date: ['', Validators.required],
            externalLink: [''],
        });
    }

    ngOnInit(): void {
        if (this.news) {
            this.newsForm.patchValue({
                title: this.news.title,
                description: this.news.description,
                date: this.news.date,
                externalLink: this.news.externalLink || '',
            });
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.imageInvalid = false;
        }
    }

    getImageUrl(filename: string): string {
        return this.adminCommService.getNewsImageUrl(filename);
    }

    deleteNews(): void {
        if (this.news?.image) {
            const confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?');
            if (confirmDelete) {
                this.deleted.emit(this.news._id);
                this.close();
            }
        }
    }

    onSubmit(): void {
        const { title, description, date, externalLink } = this.newsForm.value;
        this.newsForm.markAllAsTouched();

        if (!this.newsForm.valid) return;

        if (!this.isEditMode && !this.selectedFile) {
            this.imageInvalid = true;
            return;
        }

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('date', date);
        if (externalLink?.trim()) {
            formData.append('externalLink', externalLink.trim());
        }

        if (!this.isEditMode && this.selectedFile) {
            formData.append('image', this.selectedFile);
        }

        this.submitted.emit(formData);
        this.close();
    }

    close(): void {
        this.closed.emit();
    }
}
