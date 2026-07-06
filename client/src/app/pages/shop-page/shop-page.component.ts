import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { DialogPrefaceComponent } from '@app/components/dialog-preface/dialog-preface.component';
import { FooterComponent } from '@app/components/footer/footer.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { CachedImageComponent } from '@app/components/shared/cached-image/cached-image.component';
import { ProductCommunicationService } from '@app/services/communication/product/product.communication.service';
import { ImageCacheService } from '@app/services/image-cache/image-cache.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { Product } from '@common/interfaces/product';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-shop-page',
    standalone: true,
    imports: [CommonModule, RouterLink, CachedImageComponent, MatDialogModule, NavbarComponent, FooterComponent],
    templateUrl: './shop-page.component.html',
    styleUrl: './shop-page.component.scss',
})
export class ShopPageComponent extends BaseDestroyableComponent implements OnInit {
    products: Product[] = [];
    featuredProduct: Product | null = null;
    isLoading = true;
    hasError = false;

    constructor(
        private dialog: MatDialog,
        private productService: ProductCommunicationService,
        private imageCacheService: ImageCacheService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        console.log('🔄 ShopPage: Chargement des produits...');
        this.productService.getAllProducts()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (products) => {
                    console.log('✅ ShopPage: Produits reçus:', products);
                    this.products = products;

                    // Trouver le produit vedette (meilleure note)
                    if (products.length > 0) {
                        this.featuredProduct = products.reduce((best, current) =>
                            (current.averageReview || 0) > (best.averageReview || 0) ? current : best
                        );
                    }

                    // Preload all product images
                    const imageUrls = products.map((p) => this.getProductImageUrl(p.image));
                    this.imageCacheService.preloadImages(imageUrls);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ ShopPage: Erreur chargement produits:', err);
                    this.isLoading = false;
                    this.hasError = true;
                    this.cdr.detectChanges();
                },
            });
    }

    getProductImageUrl(filename: string): string {
        return this.productService.getImageUrl(filename);
    }

    openPreface(): void {
        this.dialog.open(DialogPrefaceComponent, {
            width: '80%',
            maxWidth: '500px',
        });
    }
}
