import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './loading-spinner.component.html',
    styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
    @Input() show: boolean = false;
}
