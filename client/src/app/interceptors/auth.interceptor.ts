import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '@app/services/session/session.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const sessionService = inject(SessionService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if ((error.status === 401 || error.status === 403) && sessionService.isAdminRoute()) {
                sessionService.notifySessionExpired();
            }
            return throwError(() => error);
        }),
    );
};
