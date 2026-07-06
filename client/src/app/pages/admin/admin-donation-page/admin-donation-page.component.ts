import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '@app/components/admin/admin-sidebar/admin-sidebar.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { PaymentStatus } from '@common/enums/payment-status';
import { Donation } from '@common/interfaces/donation';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-admin-donation-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent, LoadingSpinnerComponent],
    templateUrl: './admin-donation-page.component.html',
    styleUrl: './admin-donation-page.component.scss',
})
export class AdminDonationPageComponent extends BaseDestroyableComponent implements OnInit {
    don: Donation | null = null;
    errorMessage = '';
    isLoading = false;
    isUpdating = false;
    PaymentStatus = PaymentStatus;
    statuses = [
        { label: 'En attente', value: PaymentStatus.PENDING },
        { label: 'Effectué', value: PaymentStatus.COMPLETED },
        { label: 'Échoué', value: PaymentStatus.FAILURE },
    ];

    constructor(
        private route: ActivatedRoute,
        private adminService: AdminCommunicationService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('donId');
        if (id) {
            this.loadDonation(id);
        }
    }

    loadDonation(id: string): void {
        this.isLoading = true;
        this.adminService.getDonationById(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.don = res;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Impossible de charger ce don.');
                },
            });
    }

    onStatusChange(newStatus: PaymentStatus) {
        if (!this.don) return;

        const previousStatus = this.don.isPaid;
        this.isUpdating = true;

        this.adminService.updateDonationStatus(this.don.idDonation, newStatus)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.don!.isPaid = newStatus;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Statut du don mis à jour.');
                },
                error: () => {
                    this.don!.isPaid = previousStatus;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Échec lors de la mise à jour.');
                },
            });
    }
}
