import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { SessionService } from '@app/services/session/session.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-session-expired-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="modal-overlay" *ngIf="showModal" (click)="onOverlayClick($event)">
            <div class="modal-content">
                <div class="modal-icon">
                    <i class="bi bi-clock-history"></i>
                </div>
                <h2 class="modal-title">Session expirée</h2>
                <p class="modal-message">
                    Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter pour continuer à
                    utiliser l'interface d'administration.
                </p>
                <button class="btn-reconnect" (click)="reconnect()">
                    <i class="bi bi-box-arrow-in-right"></i>
                    Se reconnecter
                </button>
            </div>
        </div>
    `,
    styles: [
        `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
                animation: fadeIn 0.2s ease-out;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            .modal-content {
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 420px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease-out;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .modal-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto 24px;
            }

            .modal-icon i {
                font-size: 36px;
                color: white;
            }

            .modal-title {
                font-size: 24px;
                font-weight: 600;
                color: #1a1a2e;
                margin: 0 0 16px;
            }

            .modal-message {
                font-size: 15px;
                color: #666;
                line-height: 1.6;
                margin: 0 0 28px;
            }

            .btn-reconnect {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 14px 32px;
                font-size: 16px;
                font-weight: 500;
                border-radius: 8px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .btn-reconnect:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            }

            .btn-reconnect:active {
                transform: translateY(0);
            }

            .btn-reconnect i {
                font-size: 18px;
            }
        `,
    ],
})
export class SessionExpiredModalComponent implements OnInit, OnDestroy {
    showModal = false;
    private destroy$ = new Subject<void>();

    constructor(private sessionService: SessionService) {}

    ngOnInit(): void {
        this.sessionService.sessionExpired$.pipe(takeUntil(this.destroy$)).subscribe((expired) => {
            this.showModal = expired;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    reconnect(): void {
        this.sessionService.handleReconnect();
    }

    onOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
            this.reconnect();
        }
    }
}
