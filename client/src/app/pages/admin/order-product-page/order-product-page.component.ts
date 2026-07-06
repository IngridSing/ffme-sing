import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '@app/components/admin/admin-sidebar/admin-sidebar.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { AdminProductCommunicationService } from '@app/services/communication/admin/product/admin.product.communication';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { PaymentMethod } from '@common/enums/payment-method';
import { PaymentStatus } from '@common/enums/payment-status';
import { Product } from '@common/interfaces/product';
import { ProductOrder } from '@common/interfaces/product-order';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-order-product-page',
    standalone: true,
    imports: [CommonModule, AdminSidebarComponent, FormsModule, RouterLink, LoadingSpinnerComponent],
    templateUrl: './order-product-page.component.html',
    styleUrl: './order-product-page.component.scss',
})
export class OrderProductPageComponent extends BaseDestroyableComponent implements OnInit {
    orderId: string | null = null;
    order: ProductOrder | null = null;
    isLoading: boolean = false;
    isUpdating: boolean = false;
    errorMessage: string = '';

    statuses = [
        { label: 'En attente', value: PaymentStatus.PENDING },
        { label: 'Effectué', value: PaymentStatus.COMPLETED },
        { label: 'Échoué', value: PaymentStatus.FAILURE },
    ];

    constructor(
        private route: ActivatedRoute,
        private adminProductService: AdminProductCommunicationService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        this.orderId = this.route.snapshot.paramMap.get('produitId');
        if (this.orderId) {
            this.loadOrder(this.orderId);
        }
    }

    loadOrder(id: string): void {
        this.isLoading = true;
        this.adminProductService.getOrderById(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (order) => {
                    this.order = order;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors du chargement de la commande.');
                },
            });
    }

    onStatusChange(newStatus: PaymentStatus): void {
        if (!this.order) return;

        const previousStatus = this.order.isPaid;
        this.isUpdating = true;

        this.adminProductService.updateOrderStatus(this.order._id, newStatus)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.order!.isPaid = newStatus;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Statut de la commande mis à jour.');
                },
                error: () => {
                    this.order!.isPaid = previousStatus;
                    this.isUpdating = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la mise à jour du statut.');
                },
            });
    }

    getStatusLabel(status: PaymentStatus): string {
        switch (status) {
            case PaymentStatus.PENDING:
                return 'En attente';
            case PaymentStatus.COMPLETED:
                return 'Payé';
            case PaymentStatus.FAILURE:
                return 'Échoué';
            default:
                return '';
        }
    }

    getOrderCountForProduct(product: Product): number {
        if (!this.order) return 0;
        return this.order.products.filter((p) => p.title === product.title).length;
    }

    getMethodLabel(method: PaymentMethod): string {
        switch (method) {
            case PaymentMethod.SING_PAY:
                return 'SING PAY';
            case PaymentMethod.RIB:
                return 'RIB';
            case PaymentMethod.PICK_UP:
                return 'Contact direct';
            default:
                return '';
        }
    }
}
