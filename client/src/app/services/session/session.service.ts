import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SessionService {
    private sessionExpiredSubject = new BehaviorSubject<boolean>(false);

    get sessionExpired$(): Observable<boolean> {
        return this.sessionExpiredSubject.asObservable();
    }

    constructor(private router: Router) {}

    notifySessionExpired(): void {
        if (!this.sessionExpiredSubject.value) {
            this.sessionExpiredSubject.next(true);
        }
    }

    handleReconnect(): void {
        sessionStorage.removeItem('adminToken');
        this.sessionExpiredSubject.next(false);
        this.router.navigate(['/admin/login']);
    }

    isAdminRoute(): boolean {
        return window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/admin/login');
    }
}
