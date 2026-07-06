import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';

interface NavItem {
    label: string;
    route: string;
    icon: string;
    badge?: number;
    badgeType?: 'danger' | 'warning' | 'info' | 'success';
}

@Component({
    selector: 'app-admin-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './admin-sidebar.component.html',
    styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent implements OnInit {
    isCollapsed = false;
    isMobileOpen = false;

    navItems: NavItem[] = [
        { label: 'Dashboard', route: '/admin/dashboard', icon: 'fas fa-home' },
        { label: 'Dons', route: '/admin/dons', icon: 'fas fa-hand-holding-heart' },
        { label: 'Membres', route: '/admin/membres', icon: 'fas fa-users' },
        { label: 'Produits', route: '/admin/produits', icon: 'fas fa-box' },
        { label: 'Actualités', route: '/admin/news', icon: 'fas fa-newspaper' },
        { label: 'Galerie', route: '/admin/galerie', icon: 'fas fa-images' },
    ];

    pendingDonations = 0;
    pendingMembers = 0;

    constructor(
        private router: Router,
        private adminService: AdminCommunicationService,
    ) {}

    ngOnInit(): void {
        this.loadBadges();
    }

    loadBadges(): void {
        this.adminService.getStats().subscribe({
            next: (stats) => {
                this.pendingDonations = stats.pendingDonationsCount || 0;
                // Update badges
                const donsItem = this.navItems.find((item) => item.route === '/admin/dons');
                if (donsItem && this.pendingDonations > 0) {
                    donsItem.badge = this.pendingDonations;
                    donsItem.badgeType = 'warning';
                }
            },
        });
    }

    toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;
    }

    toggleMobile(): void {
        this.isMobileOpen = !this.isMobileOpen;
    }

    closeMobile(): void {
        this.isMobileOpen = false;
    }

    logout(): void {
        sessionStorage.removeItem('adminToken');
        this.router.navigate(['/admin/login']);
    }
}
