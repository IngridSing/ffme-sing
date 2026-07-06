import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';
import { MembershipCommunicationService } from '@app/services/communication/membership/membership.communication.service';
import { PaymentMethod } from '@common/enums/payment-method';

const EXPIRATION_MS = 10 * 1000; //30 m

@Component({
    selector: 'app-confirm-member-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink, CommonModule, LoadingSpinnerComponent, TitleComponent, FormsModule, FooterComponent],
    templateUrl: './confirm-member-page.component.html',
    styleUrl: './confirm-member-page.component.scss',
})
export class ConfirmMembershipPageComponent {
    PaymentMethod = PaymentMethod;
    id: string = '';
    messageErreur: string = '';
    selectedOption: string = '';
    selectedAutre: string = '';
    includeFirstMonth: boolean = false;
    montantAdhesion: number = 15000;
    montantTotal: number = 15000;
    isLoading: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private membershipCommService: MembershipCommunicationService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('membreId') || '';

        this.membershipCommService.getMembershipExists(this.id).subscribe({
            next: (res) => {
                if (!res.exists) {
                    this.messageErreur = 'Adhésion introuvable. Redirection en cours...';
                    setTimeout(() => this.router.navigate(['/']), EXPIRATION_MS);
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.messageErreur = 'Erreur serveur. Redirection en cours...';
                this.cdr.detectChanges();
                setTimeout(() => this.router.navigate(['/']), EXPIRATION_MS);
            },
        });
    }

    updateMontant(): void {
        this.montantTotal = this.montantAdhesion + (this.includeFirstMonth ? 5000 : 0);
    }

    chooseAlternative(type: 'rib' | 'contact') {
        if (this.selectedAutre === type) {
            console.log(`Moyen de paiement choisi : ${type}`);
        }
    }

    submitPayment(method: PaymentMethod): void {
        this.isLoading = true;

        this.membershipCommService.postMembershipPayment(this.id, method, this.montantTotal).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.link) {
                    window.location.href = res.link;
                } else {
                    this.messageErreur = res.message || 'Paiement enregistré. Vous recevrez un email.';
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.messageErreur = "Erreur lors de l'enregistrement du moyen de paiement.";
                console.error(err);
                this.cdr.detectChanges();
            },
        });
    }
}
