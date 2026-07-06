import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';
import { DonationCommunicationService } from '@app/services/communication/donation/donation.communication.service';
import { PaymentMethod } from '@common/enums/payment-method';

@Component({
    selector: 'app-confirm-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink, CommonModule, TitleComponent, LoadingSpinnerComponent, FormsModule, FooterComponent],
    templateUrl: './confirm-page.component.html',
    styleUrl: './confirm-page.component.scss',
})
export class ConfirmPageComponent {
    id: string = '';
    messageErreur: string = '';
    selectedOption: string = '';
    montant: number = 20000; // ou récupéré depuis le service selon le don
    selectedAutre: string = '';
    isLoading: boolean = false;

    PaymentMethod = PaymentMethod; // enum importé

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private donationCommService: DonationCommunicationService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('donId') || '';
        this.route.queryParams.subscribe((params) => {
            this.montant = Number(params['montant']) || 0;
            console.log('Montant reçu :', this.montant);
        });
        console.log(this.route.snapshot.paramMap.get('donId'));

        this.donationCommService.getDonationExists(this.id).subscribe({
            next: (res) => {
                if (!res.exists) {
                    this.messageErreur = 'Don introuvable. Vous allez être redirigé.';
                    setTimeout(() => this.router.navigate(['/']), 10000);
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.messageErreur = 'Erreur serveur. Redirection en cours...';
                this.cdr.detectChanges();
                setTimeout(() => this.router.navigate(['/']), 10000);
            },
        });
    }

    submitDonation(method: PaymentMethod): void {
        this.isLoading = true;
        this.donationCommService.postPayment(this.id, { method, montant: this.montant }).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success) {
                    this.messageErreur = 'Don enregistré avec succès. Vous recevrez les instructions par email.';
                } else {
                    this.messageErreur = res.message || "Erreur lors de l'enregistrement du don.";
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this.messageErreur = 'Erreur de communication avec le serveur.';
                this.cdr.detectChanges();
            },
        });
    }

    buySingPay(): void {
        this.isLoading = true;
        this.donationCommService.postInitiationSingPay(this.id).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success && res.link) {
                    window.location.href = res.link;
                } else {
                    this.messageErreur = res.message || "Erreur inconnue lors de l'initiation du paiement.";
                    console.log(this.messageErreur);
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this.messageErreur = 'Erreur de communication avec le serveur.';
                console.log(this.messageErreur);
                this.cdr.detectChanges();
            },
        });
    }
}
