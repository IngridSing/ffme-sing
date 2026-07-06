import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';
import { DonationCommunicationService } from '@app/services/communication/donation/donation.communication.service';

@Component({
    selector: 'app-donation-page',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule, NavbarComponent, FooterComponent, TitleComponent],
    templateUrl: './donation-page.component.html',
    styleUrl: './donation-page.component.scss',
})
export class DonationPageComponent implements OnInit {
    formDon!: FormGroup;

    montants = [10000, 50000, 100000];
    selectedMontant: number | 'custom' | null = null;
    customMontant: string = '';
    errors: any;

    constructor(
        private fb: FormBuilder,
        private donationService: DonationCommunicationService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.formDon = this.fb.group({
            motif: ['', Validators.required],
            prenom: ['', Validators.required],
            nom: ['', Validators.required],
            numero: ['', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{7,25}$/)]],
            email: ['', [Validators.required, Validators.email]],
            consentement: [false, Validators.requiredTrue],
            montant: ['', [Validators.required, this.validateMontantNonZero.bind(this)]], // ← ICI
        });
    }

    validateMontantNonZero(control: AbstractControl): ValidationErrors | null {
        const valeur = control.value?.toString().replace(/\s/g, '');
        if (!valeur || parseInt(valeur, 10) <= 0) {
            return { montantZero: true };
        }
        return null;
    }

    selectMontant(montant: number) {
        this.selectedMontant = montant;
        this.customMontant = '';
        this.formDon.patchValue({ montant });
    }
    selectCustomMontant() {
        this.selectedMontant = 'custom';

        const inputElement = document.querySelector('.input-montant') as HTMLInputElement;
        if (inputElement) {
            const rawValue = inputElement.value.replace(/\D/g, '');
            this.customMontant = rawValue;
            this.formDon.patchValue({ montant: rawValue });
            this.formDon.get('montant')?.updateValueAndValidity();
        }
    }

    onCustomMontantChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const rawValue = input.value.replace(/\D/g, '');
        const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        input.value = formatted;
        this.customMontant = rawValue;
        this.selectedMontant = 'custom';
        this.formDon.patchValue({ montant: rawValue });
        this.formDon.get('montant')?.updateValueAndValidity();
    }

    allowOnlyDigits(event: KeyboardEvent) {
        const isDigit = /^[0-9]$/.test(event.key);
        if (!isDigit) {
            event.preventDefault();
        }
    }

    onSubmit() {
        if (this.formDon.invalid) {
            this.formDon.markAllAsTouched();
            this.formDon.get('montant')?.markAsTouched();
            return;
        }

        const dataToSend = {
            ...this.formDon.value,
            montant: parseInt(this.formDon.value.montant, 10),
        };
        console.log('Données à envoyer :', dataToSend);

        this.donationService.postDonation(dataToSend).subscribe({
            next: (response) => {
                const body = response.body;
                console.log(response);
                if (body?.success) {
                    this.router.navigate(['/confirm', body.donId], {
                        queryParams: { montant: dataToSend.montant },
                    });
                } else {
                    console.log(body?.message || 'Une erreur inconnue est survenue.');
                }
            },
            error: (error) => {
                const fallback = 'Erreur du serveur.';
                try {
                    const errorData = error?.error;
                    console.log(errorData?.message || fallback);
                } catch {
                    console.log(fallback);
                }
            },
        });
    }
}
