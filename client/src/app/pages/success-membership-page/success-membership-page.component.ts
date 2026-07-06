import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { MembershipCommunicationService } from '@app/services/communication/membership/membership.communication.service';

@Component({
    selector: 'app-success-membership-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink, CommonModule, LoadingSpinnerComponent, FooterComponent],
    templateUrl: './success-membership-page.component.html',
    styleUrl: './success-membership-page.component.scss',
})
export class SuccessMembershipPageComponent implements OnInit {
    id: string = '';
    isLoading: boolean = true;
    isSuccess: boolean = false;
    message: string = '';

    constructor(
        private route: ActivatedRoute,
        private membershipService: MembershipCommunicationService,
    ) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('membershipId') || '';

        if (!this.id) {
            this.isLoading = false;
            this.isSuccess = false;
            this.message = 'Identifiant d\'adhésion manquant.';
            return;
        }

        this.membershipService.verifyPayment(this.id).subscribe({
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
