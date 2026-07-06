import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartComponent } from '@app/components/cart/cart.component';
import { DialogPrefaceComponent } from '@app/components/dialog-preface/dialog-preface.component';
import { FooterComponent } from '@app/components/footer/footer.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { CachedImageComponent } from '@app/components/shared/cached-image/cached-image.component';
import { CartStoreService } from '@app/services/cart/cart.service';
import { ProductCommunicationService } from '@app/services/communication/product/product.communication.service';
import { ImageCacheService } from '@app/services/image-cache/image-cache.service';
import { Product } from '@common/interfaces/product';

type CartItem = Product & { selectedVersionIndex: number };

@Component({
    selector: 'app-product-page',
    standalone: true,
    imports: [CommonModule, NavbarComponent, RouterLink, CartComponent, LoadingSpinnerComponent, FormsModule, FooterComponent, CachedImageComponent],
    templateUrl: './product-page.component.html',
    styleUrl: './product-page.component.scss',
})
export class ProductPageComponent implements OnInit {
    @ViewChild(CartComponent) cartComponent: CartComponent;

    Math = Math;
    product: Product;
    selectedVersionIndex: number = 0;
    isLoading: boolean = false;
    message: any;
    cart: CartItem[] = [];
    qty = 1;

    selectedTab: 'description' | 'commentaires' = 'description';
    newComment = {
        username: '',
        content: '',
        review: 0,
    };

    validatedComments: any[] = [];

    constructor(
        private route: ActivatedRoute,
        private productService: ProductCommunicationService,
        private dialog: MatDialog,
        private router: Router,
        private cartStore: CartStoreService,
        private imageCacheService: ImageCacheService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('produitId');
        console.log(id);
        if (!id) return;

        this.productService.getProductById(id).subscribe({
            next: (p) => {
                this.product = p;
                // Preload the product image
                if (p.image) {
                    this.imageCacheService.preloadImages([this.getProductImageUrl(p.image)]);
                }
                this.cdr.detectChanges();
            },
            error: () => {
                console.error('❌ Produit introuvable');
                this.cdr.detectChanges();
            },
        });

        this.productService.getValidatedCommentsByProductId(id).subscribe({
            next: (comments) => {
                this.validatedComments = comments;
                this.cdr.detectChanges();
            },
            error: () => {
                console.error('❌ Erreur lors du chargement des commentaires');
                this.cdr.detectChanges();
            },
        });
    }

    get selectedPrice(): number {
        return this.product?.versions?.[this.selectedVersionIndex]?.price || 0;
    }

    addToCart(times: number = 1) {
        for (let i = 0; i < times; i++) {
            const item = {
                ...this.product,
                selectedVersionIndex: this.selectedVersionIndex,
            };

            this.cart.push(item);
            this.cartStore.addToCart(item, times);
        }
        setTimeout(() => {
            this.cartComponent.isOpen = true;
        });
    }

    goToConfirmWithQty(times: number = 1) {
        this.router.navigate(['/produit/confirm', this.product._id], {
            state: {
                montant: this.selectedPrice * times,
                quantity: times,
                version: this.selectedVersionIndex,
            },
        });
    }

    trackByUsername(index: number, comment: any): string {
        return comment.username + '-' + index;
    }

    getProductImageUrl(filename: string): string {
        return this.productService.getImageUrl(filename);
    }

    getStarFill(index: number, rating: number): number {
        if (!rating) return 0;
        if (index <= Math.floor(rating)) return 100;
        if (index === Math.ceil(rating)) return (rating % 1) * 100;
        return 0;
    }

    submitComment(): void {
        this.message = { text: '', type: '' };

        if (!this.newComment.username || !this.newComment.content || !this.newComment.review) {
            this.message = { text: 'Tous les champs sont requis.', type: 'error' };
            return;
        }

        const id = this.route.snapshot.paramMap.get('produitId');
        if (!id) return;

        this.isLoading = true;
        this.productService.postComment(id, this.newComment).subscribe({
            next: () => {
                this.isLoading = false;
                this.message = { text: 'Merci ! Votre commentaire sera publié après validation.', type: 'success' };
                this.newComment = { username: '', content: '', review: 0 };
                this.cdr.detectChanges();
                setTimeout(() => (this.message = { text: '', type: '' }), 5000);
            },
            error: () => {
                this.isLoading = false;
                this.message = { text: "Une erreur est survenue lors de l'envoi.", type: 'error' };
                this.cdr.detectChanges();
            },
        });
    }

    openPreface(): void {
        this.dialog.open(DialogPrefaceComponent, {
            width: '80%',
            maxWidth: '500px',
        });
    }
}
