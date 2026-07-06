import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { DonationCommunicationService } from '@app/services/communication/donation/donation.communication.service';

@Component({
    selector: 'app-success-donation-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink, CommonModule, LoadingSpinnerComponent],
    templateUrl: './success-donation-page.component.html',
    styleUrl: './success-donation-page.component.scss',
})
export class SuccessDonationPageComponent implements OnInit {
    id: string = '';
    isLoading: boolean = true;
    isSuccess: boolean = false;
    message: string = '';

    constructor(
        private route: ActivatedRoute,
        private donationService: DonationCommunicationService,
    ) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('donId') || '';

        if (!this.id) {
            this.isLoading = false;
            this.isSuccess = false;
            this.message = 'Identifiant de don manquant.';
            return;
        }

        this.donationService.verifyPayment(this.id).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.isSuccess = res.success;
                this.message = res.message;
            },
            error: (err) => {
                this.isLoading = false;
                this.isSuccess = false;
                this.message = err?.error?.message || 'Erreur lors de la vérification du paiement.';
            },
        });
    }
}
