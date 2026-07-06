import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@app/interceptors/auth.interceptor';
import { cacheBusterInterceptor } from '@app/interceptors/cache-buster.interceptor';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withInMemoryScrolling } from '@angular/router';
import { AuthGuard } from '@app/guard/auth.guard';
import { AdminDonationPageComponent } from '@app/pages/admin/admin-donation-page/admin-donation-page.component';
import { DashboardPageComponent } from '@app/pages/admin/dashboard-page/dashboard-page.component';
import { LoginPageComponent } from '@app/pages/admin/login-page/login-page.component';
import { ManagementDonationsPageComponent } from '@app/pages/admin/management-donations-page/management-donations-page.component';
import { ManagementGalleryPageComponent } from '@app/pages/admin/management-gallery-page/management-gallery-page.component';
import { ManagementMembershipPageComponent } from '@app/pages/admin/management-membership-page/management-membership-page.component';
import { ManagementNewsPageComponent } from '@app/pages/admin/management-news-page/management-news-page.component';
import { ManagementProductPageComponent } from '@app/pages/admin/management-product-page/management-product-page.component';
import { MemberPageComponent } from '@app/pages/admin/member-page/member-page.component';
import { OrderProductPageComponent } from '@app/pages/admin/order-product-page/order-product-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { ConfirmMembershipPageComponent } from '@app/pages/confirm-member-page/confirm-member-page.component';
import { ConfirmOrderPageComponent } from '@app/pages/confirm-order-page/confirm-order-page.component';
import { ConfirmPageComponent } from '@app/pages/confirm-page/confirm-page.component';
import { DonationPageComponent } from '@app/pages/donation-page/donation-page.component';
import { FailedPageComponent } from '@app/pages/failed-page/failed-page.component';
import { FondationPageComponent } from '@app/pages/fondation-page/fondation-page.component';
import { GalleryPageComponent } from '@app/pages/gallery-page/gallery-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { MembershipPageComponent } from '@app/pages/membership-page/membership-page.component';
import { NewsPageComponent } from '@app/pages/news-page/news-page.component';
import { ProductPageComponent } from '@app/pages/product-page/product-page.component';
import { ShopPageComponent } from '@app/pages/shop-page/shop-page.component';
import { SuccessPageComponent } from '@app/pages/success-page/success-page.component';
import { SuccessMembershipPageComponent } from '@app/pages/success-membership-page/success-membership-page.component';
import { FailedMembershipPageComponent } from '@app/pages/failed-membership-page/failed-membership-page.component';
import { SuccessDonationPageComponent } from '@app/pages/success-donation-page/success-donation-page.component';
import { FailedDonationPageComponent } from '@app/pages/failed-donation-page/failed-donation-page.component';
import { SuccessOrderPageComponent } from '@app/pages/success-order-page/success-order-page.component';
import { FailedOrderPageComponent } from '@app/pages/failed-order-page/failed-order-page.component';
import { environment } from './environments/environment';

registerLocaleData(localeFr);

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: '/accueil', pathMatch: 'full' },
    { path: 'accueil', component: MainPageComponent },
    { path: 'fondation', component: FondationPageComponent },
    { path: 'actualites', component: NewsPageComponent },
    { path: 'don', component: DonationPageComponent },
    { path: 'produit/:produitId', component: ProductPageComponent },
    { path: 'produit/confirm/:confirmId', component: ConfirmOrderPageComponent },
    { path: 'boutique', component: ShopPageComponent },
    { path: 'confirm/:donId', component: ConfirmPageComponent },
    { path: 'confirmation/:membreId', component: ConfirmMembershipPageComponent },
    { path: 'succes/:donId', component: SuccessPageComponent },
    { path: 'echec/:donId', component: FailedPageComponent },
    { path: 'succes-adhesion/:membershipId', component: SuccessMembershipPageComponent },
    { path: 'echec-adhesion/:membershipId', component: FailedMembershipPageComponent },
    { path: 'succes-don/:donId', component: SuccessDonationPageComponent },
    { path: 'echec-don/:donId', component: FailedDonationPageComponent },
    { path: 'succes-commande/:orderId', component: SuccessOrderPageComponent },
    { path: 'echec-commande/:orderId', component: FailedOrderPageComponent },
    { path: 'membre', component: MembershipPageComponent },
    { path: 'galerie', component: GalleryPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'material', component: MaterialPageComponent },

    { path: 'admin/login', component: LoginPageComponent },
    { path: 'admin/dashboard', component: DashboardPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/galerie', component: ManagementGalleryPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/membres', component: ManagementMembershipPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/membre/:membreId', component: MemberPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/dons', component: ManagementDonationsPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/don/:donId', component: AdminDonationPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/news', component: ManagementNewsPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/produits', component: ManagementProductPageComponent, canActivate: [AuthGuard] },
    { path: 'admin/produit/:produitId', component: OrderProductPageComponent, canActivate: [AuthGuard] },

    { path: '**', redirectTo: '/accueil' },
];

bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient(withInterceptors([cacheBusterInterceptor, authInterceptor])),
        provideRouter(
            routes,
            withInMemoryScrolling({
                scrollPositionRestoration: 'enabled',
                anchorScrolling: 'enabled',
            }),
        ),
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        provideAnimations(),
    ],
});
