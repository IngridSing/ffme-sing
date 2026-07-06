import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';
import { ProductCommunicationService } from '@app/services/communication/product/product.communication.service';

@Component({
    selector: 'app-confirm-order-page',
    templateUrl: './confirm-order-page.component.html',
    styleUrl: './confirm-order-page.component.scss',
    imports: [CommonModule, NavbarComponent, TitleComponent, LoadingSpinnerComponent, ReactiveFormsModule, FormsModule, FooterComponent],
    standalone: true,
})
export class ConfirmOrderPageComponent implements OnInit {
    formCommande!: FormGroup;
    isLoading: boolean = false;
    selectedOption: 'singpay' | 'autre' | '' = '';
    montant: number = 20000;
    messageErreur: string = '';
    confirmId: string = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private productCommService: ProductCommunicationService,
        private cdr: ChangeDetectorRef,
    ) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state as { montant?: number };
        this.montant = state?.montant ?? 0;
    }

    ngOnInit(): void {
        this.formCommande = this.fb.group({
            prenom: ['', Validators.required],
            nom: ['', Validators.required],
            numero: ['', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{7,25}$/)]],
            email: ['', [Validators.required, Validators.email]],
            consentement: [false, Validators.requiredTrue],
        });

        this.confirmId = this.route.snapshot.paramMap.get('confirmId') ?? '';
    }

    onSubmit(): void {
        if (this.formCommande.invalid) {
            this.formCommande.markAllAsTouched();
            return;
        }

        const dataToSend = {
            ...this.formCommande.value,
            montant: this.montant,
        };

        this.isLoading = true;
        this.productCommService.postorderPayment(this.confirmId, this.montant, dataToSend).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success && res.link) {
                    // Redirection vers le portail de paiement Singpay
                    window.location.href = res.link;
                } else {
                    this.messageErreur = res.message || 'Erreur lors de la commande.';
                    console.error('Erreur paiement:', this.messageErreur);
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.messageErreur = `Erreur de communication avec le serveur : ${err.error?.message || 'Erreur inconnue'}`;
                console.error('Erreur serveur:', this.messageErreur);
                this.cdr.detectChanges();
            },
        });
    }
}
