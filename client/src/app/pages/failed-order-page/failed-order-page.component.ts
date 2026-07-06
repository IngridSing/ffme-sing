import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '@app/components/navbar/navbar.component';

@Component({
    selector: 'app-failed-order-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink],
    templateUrl: './failed-order-page.component.html',
    styleUrl: './failed-order-page.component.scss',
})
export class FailedOrderPageComponent implements OnInit {
    orderId: string = '';

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
    }
}
