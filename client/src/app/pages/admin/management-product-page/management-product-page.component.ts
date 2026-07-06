import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '@app/components/admin/admin-sidebar/admin-sidebar.component';
import { FormProductComponent } from '@app/components/admin/form-product/form-product.component';
import { LoadingSpinnerComponent } from '@app/components/loading-spinner/loading-spinner.component';
import { CachedImageComponent } from '@app/components/shared/cached-image/cached-image.component';
import { AdminProductCommunicationService } from '@app/services/communication/admin/product/admin.product.communication';
import { ImageCacheService } from '@app/services/image-cache/image-cache.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { PaymentStatus } from '@common/enums/payment-status';
import { ProductComment } from '@common/interfaces/comment';
import { Product } from '@common/interfaces/product';
import { ProductOrder } from '@common/interfaces/product-order';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-management-product-page',
    standalone: true,
    imports: [CommonModule, AdminSidebarComponent, FormsModule, LoadingSpinnerComponent, FormProductComponent, CachedImageComponent],
    templateUrl: './management-product-page.component.html',
    styleUrls: ['./management-product-page.component.scss'],
})
export class ManagementProductPageComponent extends BaseDestroyableComponent implements OnInit {
    PaymentStatus = PaymentStatus;
    showForm = false;
    selectedProduct: Product | null = null;
    showComments = false;
    editProduct: Product | null = null;
    editedStock: number | null = null;
    isEditingStock = false;
    productList: Product[] = [];
    orders: ProductOrder[] = [];
    isLoading: boolean = false;

    constructor(
        private router: Router,
        private adminProductService: AdminProductCommunicationService,
        private notificationService: NotificationService,
        private imageCacheService: ImageCacheService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        this.loadProducts();
        this.loadOrders();
    }

    loadProducts(): void {
        this.isLoading = true;
        this.adminProductService.getAllProducts()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (products) => {
                    this.productList = products;
                    // Preload all product images
                    const imageUrls = products.map((p) => this.getProductImageUrl(p.image));
                    this.imageCacheService.preloadImages(imageUrls);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors du chargement des produits.');
                },
            });
    }

    loadOrders(): void {
        this.adminProductService.getAllOrders()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (orders) => {
                    this.orders = orders;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.notificationService.error('Erreur lors du chargement des commandes.');
                },
            });
    }

    goToOrderDetail(orderId: string): void {
        this.router.navigate(['/admin/produit', orderId]);
    }

    getPendingOrdersCount(): number {
        return this.orders.filter(order => order.isPaid === PaymentStatus.PENDING).length;
    }

    getCompletedOrdersCount(): number {
        return this.orders.filter(order => order.isPaid === PaymentStatus.COMPLETED).length;
    }

    getTotalOrdersAmount(): number {
        return this.orders
            .filter(order => order.isPaid === PaymentStatus.COMPLETED)
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    }

    getProductImageUrl(filename: string): string {
        return this.adminProductService.getImageUrl(filename);
    }

    toggleComments(): void {
        this.showComments = !this.showComments;
    }

    toggleEditStock(): void {
        if (this.isEditingStock && this.selectedProduct && this.editedStock !== null) {
            this.selectedProduct.stock = this.editedStock;

            const updatedData = new FormData();
            updatedData.append('title', this.selectedProduct.title);
            updatedData.append('description', this.selectedProduct.description);
            updatedData.append('about', JSON.stringify(this.selectedProduct.about));
            updatedData.append('extraLink', JSON.stringify(this.selectedProduct.extraLink || {}));
            updatedData.append('type', this.selectedProduct.type);
            updatedData.append('stock', String(this.editedStock));
            updatedData.append('versions', JSON.stringify(this.selectedProduct.versions));

            this.isLoading = true;
            this.adminProductService.updateProduct(this.selectedProduct._id!, updatedData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updated) => {
                        this.selectedProduct = updated;
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.success('Stock mis à jour avec succès.');
                    },
                    error: () => {
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.notificationService.error('Erreur lors de la mise à jour du stock.');
                    },
                });
        } else if (this.selectedProduct) {
            this.editedStock = this.selectedProduct.stock;
        }
        this.isEditingStock = !this.isEditingStock;
    }

    selectProduct(product: Product): void {
        this.selectedProduct = product;
        this.editedStock = product.stock;
        this.isEditingStock = false;
        this.showComments = false;
    }

    openAddProductModal(): void {
        this.editProduct = null;
        this.showForm = true;
    }

    handleNewProduct(formData: FormData): void {
        this.isLoading = true;

        const request$ = this.editProduct
            ? this.adminProductService.updateProduct(this.editProduct._id!, formData)
            : this.adminProductService.postProduct(formData);

        request$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.loadProducts();
                    this.showForm = false;
                    this.notificationService.success(this.editProduct ? 'Produit modifié avec succès.' : 'Produit créé avec succès.');
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de l\'opération.');
                },
            });
    }

    editProductForm(product: Product): void {
        this.editProduct = product;
        this.showForm = true;
    }

    deleteProduct(product: Product): void {
        const confirmDelete = confirm(`Supprimer le produit "${product.title}" ?`);
        if (!confirmDelete || !product._id) return;

        this.isLoading = true;
        this.adminProductService.deleteProduct(product._id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.productList = this.productList.filter(p => p._id !== product._id);
                    if (this.selectedProduct?.title === product.title) {
                        this.selectedProduct = null;
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Produit supprimé avec succès.');
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la suppression.');
                },
            });
    }

    validateComment(comment: ProductComment): void {
        if (!this.selectedProduct?._id || !comment._id) return;

        this.isLoading = true;
        const commentId = typeof comment._id === 'string' ? comment._id : comment._id.toString();
        this.adminProductService.patchProductComment(this.selectedProduct._id, commentId, 'validate')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedProduct: Product | null) => {
                    if (updatedProduct) {
                        this.selectedProduct = updatedProduct;
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Commentaire validé avec succès.');
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la validation.');
                },
            });
    }

    deleteComment(comment: ProductComment): void {
        if (!this.selectedProduct?._id || !comment._id) return;

        const confirmDelete = confirm(`Supprimer le commentaire de ${comment.userName} ?`);
        if (!confirmDelete) return;

        this.isLoading = true;
        const commentId = typeof comment._id === 'string' ? comment._id : comment._id.toString();
        this.adminProductService.patchProductComment(this.selectedProduct._id, commentId, 'delete')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedProduct) => {
                    if (updatedProduct) {
                        this.selectedProduct = updatedProduct;
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.success('Commentaire supprimé avec succès.');
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors de la suppression du commentaire.');
                },
            });
    }
}
