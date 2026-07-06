import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CartStoreService } from '@app/services/cart/cart.service';
import { ProductCommunicationService } from '@app/services/communication/product/product.communication.service';
import { Product } from '@common/interfaces/product';

type CartItem = Product & { selectedVersionIndex: number };

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.scss',
})
export class CartComponent {
    cart: CartItem[] = [];
    isOpen = false;

    constructor(
        private cartStore: CartStoreService,
        private readonly productCommService: ProductCommunicationService,
        private router: Router,
    ) {
        this.cart = cartStore.getCart();
    }

    get total(): number {
        return this.cart.reduce((sum, p) => {
            const versionIndex = p.selectedVersionIndex;
            const price = p.versions?.[versionIndex]?.price || 0;
            return sum + price;
        }, 0);
    }

    get groupedCart() {
        const grouped: { product: CartItem; versionIndex: number; count: number }[] = [];

        this.cart.forEach((p) => {
            const versionIndex = p.selectedVersionIndex;
            const existing = grouped.find((item) => item.product._id === p._id && item.versionIndex === versionIndex);

            if (existing) {
                existing.count++;
            } else {
                grouped.push({ product: p, versionIndex, count: 1 });
            }
        });

        return grouped;
    }

    addToCart(product: Product, selectedVersionIndex: number) {
        const selectedVersion = product.versions[selectedVersionIndex];

        this.cart.push({
            ...product,
            selectedVersionIndex,
            versions: [selectedVersion],
        });
    }

    removeOne(product: CartItem, versionIndex: number) {
        this.cartStore.removeOne(product);
        this.cart = this.cartStore.getCart();
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    validate() {
        const commande = this.groupedCart.map((entry) => ({
            _id: entry.product._id,
            versionLabel: entry.product.versions[entry.versionIndex].label,
            price: entry.product.versions[entry.versionIndex].price,
            quantity: entry.count,
        }));

        this.productCommService.postOrderToValidate({ items: commande }).subscribe({
            next: (res) => {
                if (res.success && res.orderId) {
                    this.router.navigate(['/produit/confirm', res.orderId], {
                        state: { montant: res.total },
                    });
                } else {
                    alert('Erreur : ' + (res.message || 'Commande invalide'));
                }
            },
            error: () => {
                alert('Erreur de communication avec le serveur.');
            },
        });
    }
}
