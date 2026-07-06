import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
    @Input() customBackground?: string;
    isMenuOpen: boolean = false;
    menuOpen = false;
    isScrolled = false;

    private scrollThreshold = 50;

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.checkScroll();
    }

    @HostListener('window:scroll')
    onWindowScroll(): void {
        this.checkScroll();
    }

    private checkScroll(): void {
        this.isScrolled = window.scrollY > this.scrollThreshold;
    }

    get isFixed(): boolean {
        return !!this.customBackground;
    }

    goToPageAndReload(route: string): void {
        this.router.navigateByUrl(route).then(() => {
            window.location.reload();
        });
    }

    toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
        this.isMenuOpen = !this.isMenuOpen;

        // Bloquer le scroll du body quand le menu est ouvert
        if (this.menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}
