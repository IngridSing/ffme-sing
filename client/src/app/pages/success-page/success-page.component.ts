import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { DonationCommunicationService } from '@app/services/communication/donation/donation.communication.service';

@Component({
    selector: 'app-success-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink],
    templateUrl: './success-page.component.html',
    styleUrl: './success-page.component.scss',
})
export class SuccessPageComponent {
    id: string = '';

    constructor(
        private route: ActivatedRoute,
        private donationService: DonationCommunicationService,
    ) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('donId') || '';
        console.log('Appel de verifyPayment avec ID :', this.id);
        this.donationService.getVerifyPayment(this.id).subscribe({
            next: (res) => console.log('Résultat de verifyPayment:', res),
            error: (err) => console.error('Erreur pendant verifyPayment:', err),
        });
    }
}
