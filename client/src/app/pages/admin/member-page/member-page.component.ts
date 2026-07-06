import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '@app/components/admin/admin-sidebar/admin-sidebar.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { PaymentStatus } from '@common/enums/payment-status';
import { takeUntil } from 'rxjs/operators';

@Pipe({
    name: 'safeUrl',
    standalone: true,
})
export class SafeUrlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}
    transform(url: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}

interface MemberWithDocuments {
    idMember: string;
    firstName: string;
    lastName: string;
    phone: string;
    isValidated: boolean;
    email: string;
    amount: number;
    isPaid: boolean;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    additionalDocuments: { [key: string]: string };
    documents: any;
}

@Component({
    selector: 'app-member-page',
    standalone: true,
    imports: [AdminSidebarComponent, CommonModule, RouterLink, SafeUrlPipe, FormsModule, LoadingSpinnerComponent],
    templateUrl: './member-page.component.html',
    styleUrl: './member-page.component.scss',
})
export class MemberPageComponent extends BaseDestroyableComponent implements OnInit {
    PaymentStatus = PaymentStatus;
    member: MemberWithDocuments | null = null;
    statuses = [
        { label: 'En attente', value: PaymentStatus.PENDING },
        { label: 'Effectué', value: PaymentStatus.COMPLETED },
        { label: 'Échoué', value: PaymentStatus.FAILURE },
    ];
    documents: {
        filename: string;
        mime: string;
        title: string;
        typeKey: string;
        previewUrl: string;
    }[] = [];
    errorMessage = '';
    isLoading = true;
    isUpdating = false;
    previewUrl: string | null = null;
    previewFilename: string | null = null;
    id: string | null = '';

    constructor(
        private route: ActivatedRoute,
        private adminService: AdminCommunicationService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.id = params.get('membreId');
                if (this.id) {
                    this.loadMember(this.id);
                }
            });
    }

    loadMember(id: string): void {
        this.isLoading = true;
        this.adminService.getMemberById(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const tempMember = response.member;
                    tempMember.documents = response.document ?? [];
                    this.member = tempMember;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Impossible de charger les données du membre.');
                },
            });
    }

    getStatusLabel(status: PaymentStatus): string {
        const found = this.statuses.find((s) => s.value === status);
        return found?.label ?? status;
    }

    onStatusChange(newStatus: PaymentStatus) {
        if (!this.id || !this.member) return;

        const previousStatus = this.member.paymentStatus;
        this.isUpdating = true;

        this.adminService.updatePaymentStatus(this.id, newStatus)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    if (this.member) this.member.paymentStatus = newStatus;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Statut de paiement mis à jour.');
                },
                error: () => {
                    if (this.member) this.member.paymentStatus = previousStatus;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la mise à jour du statut.');
                },
            });
    }

    onValidateToggle() {
        if (!this.member || !this.id) return;

        const newValidation = !this.member.isValidated;
        const previousValidation = this.member.isValidated;
        this.isUpdating = true;

        this.adminService.updateValidation(this.id, newValidation)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    if (this.member) this.member.isValidated = newValidation;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.success(newValidation ? 'Membre certifié.' : 'Certification retirée.');
                },
                error: () => {
                    if (this.member) this.member.isValidated = previousValidation;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la mise à jour.');
                },
            });
    }

    openDocument(fileId: string, filename: string) {
        this.adminService.getDocumentStreamById(fileId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const newTab = window.open();
                    if (newTab) {
                        newTab.document.write(`
                        <html>
                            <head><title>${filename}</title></head>
                            <body style="margin:0">
                                <iframe src="${url}" frameborder="0" style="width:100vw;height:100vh"></iframe>
                            </body>
                        </html>
                    `);
                        newTab.document.close();
                    } else {
                        this.notificationService.warning('Impossible d\'ouvrir le fichier (popup bloqué).');
                    }
                },
                error: () => {
                    this.notificationService.error('Erreur lors de l\'ouverture du document.');
                },
            });
    }

    getDocumentIconClass(mime: string): string {
        if (mime.includes('pdf')) return 'bi bi-file-earmark-pdf text-danger';
        if (mime.includes('word')) return 'bi bi-file-earmark-word text-primary';
        if (mime.includes('png') || mime.includes('jpeg')) return 'bi bi-file-earmark-image';
        return 'bi bi-file-earmark';
    }

    getTypedDocuments() {
        return this.documents.map((doc) => ({
            ...doc,
            label: doc.title,
        }));
    }

    getDocumentLabel(key: string): string {
        switch (key) {
            case 'cv':
                return 'CV';
            case 'photo':
                return 'Photo';
            case 'identity':
                return 'Pièce d\'identité';
            case 'form':
                return 'Formulaire d\'adhésion';
            default:
                return key.charAt(0).toUpperCase() + key.slice(1);
        }
    }

    previewBase64(base64: string, filename: string) {
        const mimeType = this.getMimeTypeFromFilename(filename);
        const fileUrl = `data:${mimeType};base64,${base64}`;
        const newTab = window.open();
        if (newTab) {
            newTab.document.write(`
            <html>
                <head>
                <link rel="icon" type="image/png" href="assets/icon-logo.png" />
                <title>${filename}</title>
                </head>
                <body style="margin:0">
                    <iframe src="${fileUrl}" frameborder="0" style="width:100vw;height:100vh"></iframe>
                </body>
            </html>
        `);
            newTab.document.close();
        } else {
            this.errorMessage = 'Impossible d\'ouvrir le fichier (popup bloqué).';
        }
    }

    formatTitle(key: string): string {
        switch (key?.toLowerCase()) {
            case 'cv':
                return 'CV';
            case 'photo':
                return 'Photo';
            case 'id':
                return 'Pièce d\'identité';
            case 'formulaire':
                return 'Fiche d\'adhésion';
            default:
                return key.charAt(0).toUpperCase() + key.slice(1);
        }
    }

    getMimeTypeFromFilename(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
                return 'application/pdf';
            case 'png':
                return 'image/png';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'doc':
                return 'application/msword';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            default:
                return 'application/octet-stream';
        }
    }
}
