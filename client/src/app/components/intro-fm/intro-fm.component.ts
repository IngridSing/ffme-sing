import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-intro-fm',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './intro-fm.component.html',
    styleUrl: './intro-fm.component.scss',
})
export class IntroFMComponent {
    ngAfterViewInit(): void {
        const elements = document.querySelectorAll('.animate-on-scroll');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                    }
                });
            },
            {
                threshold: 0.2, // seuil de déclenchement (20% visible)
            },
        );

        elements.forEach((el) => observer.observe(el));
    }
}
