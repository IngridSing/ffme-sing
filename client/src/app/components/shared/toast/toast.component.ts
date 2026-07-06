import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationService, Toast } from '@app/services/notification/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="toast-container">
            <div
                *ngFor="let toast of toasts"
                class="toast-item"
                [class.toast-success]="toast.type === 'success'"
                [class.toast-error]="toast.type === 'error'"
                [class.toast-warning]="toast.type === 'warning'"
                [class.toast-info]="toast.type === 'info'"
            >
                <div class="toast-icon">
                    <i *ngIf="toast.type === 'success'" class="bi bi-check-circle-fill"></i>
                    <i *ngIf="toast.type === 'error'" class="bi bi-x-circle-fill"></i>
                    <i *ngIf="toast.type === 'warning'" class="bi bi-exclamation-triangle-fill"></i>
                    <i *ngIf="toast.type === 'info'" class="bi bi-info-circle-fill"></i>
                </div>
                <div class="toast-message">{{ toast.message }}</div>
                <button class="toast-close" (click)="dismiss(toast.id)">&times;</button>
            </div>
        </div>
    `,
    styles: [
        `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }

            .toast-item {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease-out;
                color: white;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .toast-success {
                background-color: #28a745;
            }

            .toast-error {
                background-color: #dc3545;
            }

            .toast-warning {
                background-color: #ffc107;
                color: #212529;
            }

            .toast-info {
                background-color: #17a2b8;
            }

            .toast-icon {
                margin-right: 12px;
                font-size: 1.2rem;
            }

            .toast-message {
                flex: 1;
                font-size: 0.95rem;
            }

            .toast-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 1.3rem;
                cursor: pointer;
                padding: 0 0 0 12px;
                opacity: 0.8;
            }

            .toast-close:hover {
                opacity: 1;
            }
        `,
    ],
})
export class ToastComponent implements OnInit, OnDestroy {
    toasts: Toast[] = [];
    private destroy$ = new Subject<void>();

    constructor(private notificationService: NotificationService) {}

    ngOnInit(): void {
        this.notificationService.toasts$.pipe(takeUntil(this.destroy$)).subscribe((toasts) => {
            this.toasts = toasts;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    dismiss(id: number): void {
        this.notificationService.removeToast(id);
    }
}
