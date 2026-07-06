import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '@app/components/navbar/navbar.component';

@Component({
    selector: 'app-failed-donation-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink],
    templateUrl: './failed-donation-page.component.html',
    styleUrl: './failed-donation-page.component.scss',
})
export class FailedDonationPageComponent implements OnInit {
    id: string = '';

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('donId') || '';
    }
}
