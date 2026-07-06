import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { ProductCommunicationService } from '@app/services/communication/product/product.communication.service';

@Component({
    selector: 'app-success-order-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink, CommonModule, LoadingSpinnerComponent],
    templateUrl: './success-order-page.component.html',
    styleUrl: './success-order-page.component.scss',
})
export class SuccessOrderPageComponent implements OnInit {
    orderId: string = '';
    isLoading: boolean = true;
    isSuccess: boolean = false;
    message: string = '';

    constructor(
        private route: ActivatedRoute,
        private productService: ProductCommunicationService,
    ) {}

    ngOnInit(): void {
        this.orderId = this.route.snapshot.paramMap.get('orderId') || '';

        if (!this.orderId) {
            this.isLoading = false;
            this.isSuccess = false;
            this.message = 'Identifiant de commande manquant.';
            return;
        }

        this.productService.verifyPayment(this.orderId).subscribe({
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
