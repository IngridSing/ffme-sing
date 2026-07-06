import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private toasts: Toast[] = [];
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    private idCounter = 0;

    get toasts$(): Observable<Toast[]> {
        return this.toastsSubject.asObservable();
    }

    success(message: string, duration = 3000): void {
        this.addToast(message, 'success', duration);
    }

    error(message: string, duration = 5000): void {
        this.addToast(message, 'error', duration);
    }

    warning(message: string, duration = 4000): void {
        this.addToast(message, 'warning', duration);
    }

    info(message: string, duration = 3000): void {
        this.addToast(message, 'info', duration);
    }

    private addToast(message: string, type: Toast['type'], duration: number): void {
        const toast: Toast = {
            id: ++this.idCounter,
            message,
            type,
            duration,
        };

        this.toasts.push(toast);
        this.toastsSubject.next([...this.toasts]);

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast.id), duration);
        }
    }

    removeToast(id: number): void {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        this.toastsSubject.next([...this.toasts]);
    }
}
