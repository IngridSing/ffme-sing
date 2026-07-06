import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Video } from '@common/interfaces/video';

@Component({
    selector: 'app-form-video',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form-video.component.html',
})
export class FormVideoComponent implements OnInit {
    @Input() video: Video | null = null;
    @Input() isEditMode = false;

    @Output() submitted = new EventEmitter<{ title: string; description: string; videoUrl: string; date: string }>();
    @Output() closed = new EventEmitter<void>();
    @Output() deleted = new EventEmitter<string>();

    videoForm: FormGroup;
    thumbnailPreview: string | null = null;

    constructor(private fb: FormBuilder) {
        this.videoForm = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            videoUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
            date: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        if (this.video) {
            this.videoForm.patchValue({
                title: this.video.title,
                description: this.video.description,
                videoUrl: this.video.videoUrl,
                date: this.video.date,
            });
            this.thumbnailPreview = this.video.thumbnailUrl;
        }

        this.videoForm.get('videoUrl')?.valueChanges.subscribe((url) => {
            this.updateThumbnailPreview(url);
        });
    }

    updateThumbnailPreview(url: string): void {
        if (!url) {
            this.thumbnailPreview = null;
            return;
        }

        // YouTube
        const youtubePatterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
        ];

        for (const pattern of youtubePatterns) {
            const match = url.match(pattern);
            if (match) {
                this.thumbnailPreview = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
                return;
            }
        }

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            this.thumbnailPreview = `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
            return;
        }

        this.thumbnailPreview = null;
    }

    deleteVideo(): void {
        if (this.video) {
            const confirmDelete = confirm('Etes-vous sur de vouloir supprimer cette video ?');
            if (confirmDelete) {
                this.deleted.emit(this.video._id);
                this.close();
            }
        }
    }

    onSubmit(): void {
        this.videoForm.markAllAsTouched();

        if (!this.videoForm.valid) return;

        const { title, description, videoUrl, date } = this.videoForm.value;

        this.submitted.emit({
            title: title.trim(),
            description: description.trim(),
            videoUrl: videoUrl.trim(),
            date,
        });
        this.close();
    }

    close(): void {
        this.closed.emit();
    }
}
