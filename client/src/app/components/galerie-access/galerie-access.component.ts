import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-galerie-access',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './galerie-access.component.html',
    styleUrl: './galerie-access.component.scss',
})
export class GalerieAccessComponent {
    ngAfterViewInit(): void {
        const elements = document.querySelectorAll('.animate-on-scroll');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 },
        );

        elements.forEach((el) => observer.observe(el));
    }
}
