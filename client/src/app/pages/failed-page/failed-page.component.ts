import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '@app/components/navbar/navbar.component';

@Component({
    selector: 'app-failed-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink],
    templateUrl: './failed-page.component.html',
    styleUrl: './failed-page.component.scss',
})
export class FailedPageComponent {}
