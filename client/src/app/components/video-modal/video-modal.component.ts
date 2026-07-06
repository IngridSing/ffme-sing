import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { SafeUrlPipe } from '@app/pipes/safe-url.pipe';

@Component({
    selector: 'app-video-modal',
    standalone: true,
    imports: [CommonModule, SafeUrlPipe],
    templateUrl: './video-modal.component.html',
    styleUrl: './video-modal.component.scss',
})
export class VideoModalComponent {
    @Input() embedUrl: string = '';
    @Input() title: string = '';
    @Output() closed = new EventEmitter<void>();

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        this.close();
    }

    close(): void {
        this.closed.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('video-modal')) {
            this.close();
        }
    }
}
