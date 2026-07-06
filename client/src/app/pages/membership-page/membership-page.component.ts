import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';
import { MembershipCommunicationService } from '@app/services/communication/membership/membership.communication.service';
import { TypeMember } from '@common/enums/type-member';

@Component({
    selector: 'app-membership-page',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, NavbarComponent, TitleComponent, ReactiveFormsModule, FormsModule, FooterComponent],
    templateUrl: './membership-page.component.html',
    styleUrl: './membership-page.component.scss',
})
export class MembershipPageComponent implements OnInit {
    TypeMember = TypeMember;
    typeOptions = [
        { value: TypeMember.ACTIVE, label: 'Membre actif' },
        { value: TypeMember.VOLUNTEER, label: 'Membre bénévole' },
    ];
    formMembre!: FormGroup;
    showErrors = false;
    documentError = false;
    messageErreur: string = '';
    isLoading: boolean = false;
    fichiersUploadés: File[] = [];

    fichiers: { [cle: string]: File | null } = {
        cv: null,
        photo: null,
        id: null,
        formulaire: null,
    };
    fileErrors: { [cle: string]: string | null } = {
        cv: null,
        photo: null,
        id: null,
        formulaire: null,
    };

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private membershipCommService: MembershipCommunicationService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.formMembre = this.fb.group({
            typeAdhesion: ['', Validators.required],
            prenom: ['', Validators.required],
            nom: ['', Validators.required],
            numero: ['', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{7,25}$/)]],
            email: ['', [Validators.required, Validators.email]],
            consentement: [false, Validators.requiredTrue],
        });
    }

    onFileSelect(event: Event, type: string) {
        const input = event.target as HTMLInputElement;
        const maxSizeMB = 5;

        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const fileSizeMB = file.size / (1024 * 1024);
            const fileType = file.type;

            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/png',
                'image/jpeg',
            ];

            if (!allowedTypes.includes(fileType)) {
                this.fileErrors[type] = 'Format non accepté (PDF, Word, PNG, JPG uniquement)';
                this.fichiers[type] = null;
                return;
            }

            if (fileSizeMB > maxSizeMB) {
                this.fileErrors[type] = 'Fichier trop volumineux (max. 5 Mo)';
                this.fichiers[type] = null;
                return;
            }

            this.fichiers[type] = file;
            this.fileErrors[type] = null;
        }
    }

    removeFile(type: 'cv' | 'photo' | 'id' | 'formulaire') {
        this.fichiers[type] = null;
    }

    // Pour fichier sélectionné via clic
    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.addFiles(input.files);
        }
    }

    addFiles(files: FileList): void {
        const nouveauxFichiers = Array.from(files);
        this.fichiersUploadés.push(...nouveauxFichiers);
        console.log('Fichiers reçus :', this.fichiersUploadés);
    }

    onSubmit(): void {
        const tousLesDocsPresent = Object.values(this.fichiers).every((fichier) => fichier !== null);

        if (this.formMembre.invalid || !tousLesDocsPresent) {
            this.formMembre.markAllAsTouched();
            this.documentError = !tousLesDocsPresent;
            return;
        }

        // Traitement des données valides
        const dataToSend = {
            ...this.formMembre.value,
            fichiers: this.fichiers,
        };

        const formData = new FormData();

        for (const [key, value] of Object.entries(dataToSend)) {
            if (key === 'fichiers') continue;

            if (typeof value === 'boolean') {
                formData.append(key, value ? 'true' : 'false');
            } else if (Array.isArray(value)) {
                formData.append(key, value[0]); // ou adapte selon ton besoin
            } else {
                formData.append(key, value as string);
            }
        }

        // Ajoute les fichiers (fichiers est un objet avec clé => File)
        Object.entries(dataToSend.fichiers).forEach(([cle, fichier]) => {
            if (fichier instanceof File) {
                formData.append(cle, fichier);
            }
        });

        this.isLoading = true;

        this.membershipCommService.postMembership(formData).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success && res.membershipId) {
                    this.router.navigate(['/confirmation', res.membershipId]);
                } else {
                    this.messageErreur = res.message || 'Erreur inconnue.';
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.messageErreur = err?.error?.message || 'Erreur lors de la soumission.';
                this.cdr.detectChanges();
            },
        });
    }
}
