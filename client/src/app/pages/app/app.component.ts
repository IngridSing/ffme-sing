import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SessionExpiredModalComponent } from '@app/components/shared/session-expired-modal/session-expired-modal.component';
import { ToastComponent } from '@app/components/shared/toast/toast.component';
import { filter, pairwise } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, ToastComponent, SessionExpiredModalComponent],
})
export class AppComponent {
    private previousUrl = '';

    constructor(private router: Router) {
        this.router.events
            .pipe(
                filter((event): event is NavigationEnd => event instanceof NavigationEnd),
                pairwise(),
            )
            .subscribe(([prev, curr]) => {
                this.previousUrl = (prev as NavigationEnd).urlAfterRedirects;
                const currentUrl = (curr as NavigationEnd).urlAfterRedirects;

                const wentToAdminPage = !this.previousUrl.startsWith('/admin') && currentUrl.startsWith('/admin');

                if (wentToAdminPage) {
                    window.location.reload();
                }
            });
    }
}
