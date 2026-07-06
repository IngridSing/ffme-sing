import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatCardVariant = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stat-card.component.html',
    styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
    @Input() title: string = '';
    @Input() value: string | number = 0;
    @Input() subtitle?: string;
    @Input() icon?: string;
    @Input() variant: StatCardVariant = 'primary';
    @Input() trend?: number;
    @Input() trendLabel?: string;
    @Input() loading: boolean = false;
}
