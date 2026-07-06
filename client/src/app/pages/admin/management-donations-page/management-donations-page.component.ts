import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '@app/components/admin/admin-sidebar/admin-sidebar.component';
import { DataTableComponent, TableColumn } from '@app/components/admin/data-table/data-table.component';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { PaymentStatus } from '@common/enums/payment-status';
import { Donation } from '@common/interfaces/donation';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-management-donations-page',
    standalone: true,
    imports: [CommonModule, AdminSidebarComponent, DataTableComponent],
    templateUrl: './management-donations-page.component.html',
    styleUrl: './management-donations-page.component.scss',
})
export class ManagementDonationsPageComponent extends BaseDestroyableComponent implements OnInit {
    donations: Donation[] = [];
    PaymentStatus = PaymentStatus;
    isLoading = false;

    // Configuration des colonnes du tableau
    columns: TableColumn[] = [
        { key: 'firstName', label: 'Prénom', sortable: true },
        { key: 'lastName', label: 'Nom', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'amount', label: 'Montant', sortable: true, type: 'currency' },
        { key: 'registrationDate', label: 'Date', sortable: true, type: 'date' },
        { key: 'isPaid', label: 'Statut', sortable: true, type: 'status' },
    ];

    constructor(
        private adminService: AdminCommunicationService,
        private router: Router,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        this.loadDonations();
    }

    loadDonations(): void {
        this.isLoading = true;
        this.adminService
            .getAllDonations()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.donations = data;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors du chargement des dons.');
                },
            });
    }

    onRowClick(donation: Donation): void {
        this.router.navigate(['/admin/don', donation.idDonation]);
    }

    onSelectionChange(selected: Donation[]): void {
        console.log('Selected donations:', selected);
    }
}
