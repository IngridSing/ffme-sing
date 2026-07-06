import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '@app/components/admin/admin-sidebar/admin-sidebar.component';
import { StatCardComponent } from '@app/components/admin/stat-card/stat-card.component';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { BaseDestroyableComponent } from '@app/shared/base-destroyable.component';
import { DashboardStats } from '@common/interfaces/dashboard-stats';
import { PaymentStatus } from '@common/enums/payment-status';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { takeUntil } from 'rxjs/operators';

// Register Chart.js components
Chart.register(...registerables);

@Component({
    selector: 'app-dashboard-page',
    standalone: true,
    imports: [AdminSidebarComponent, CommonModule, StatCardComponent, RouterLink],
    templateUrl: './dashboard-page.component.html',
    styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent extends BaseDestroyableComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    stats: DashboardStats | null = null;
    isLoading = false;
    private chart: Chart | null = null;
    private chartDataLoaded = false;
    private chartLabels: string[] = [];
    private donationsData: number[] = [];
    private membersData: number[] = [];

    constructor(
        private router: Router,
        private adminService: AdminCommunicationService,
        private notificationService: NotificationService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    ngOnInit(): void {
        this.loadStats();
        this.loadChartData();
    }

    ngAfterViewInit(): void {
        // Initialize chart if data is already loaded
        if (this.chartDataLoaded) {
            this.initChart();
        }
    }

    override ngOnDestroy(): void {
        super.ngOnDestroy();
        if (this.chart) {
            this.chart.destroy();
        }
    }

    loadStats(): void {
        this.isLoading = true;
        this.adminService
            .getStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (stats) => {
                    this.stats = stats;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.notificationService.error('Erreur lors du chargement des statistiques.');
                },
            });
    }

    loadChartData(): void {
        this.adminService
            .getChartData()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.chartLabels = data.labels;
                    this.donationsData = data.donations;
                    this.membersData = data.members;
                    this.chartDataLoaded = true;

                    // Initialize chart if view is ready
                    if (this.chartCanvas) {
                        this.initChart();
                    }
                },
                error: () => {
                    // Fallback avec données mockées si erreur
                    this.initFallbackChart();
                },
            });
    }

    initFallbackChart(): void {
        this.chartLabels = this.getLast6Months();
        this.donationsData = [0, 0, 0, 0, 0, 0];
        this.membersData = [0, 0, 0, 0, 0, 0];
        this.chartDataLoaded = true;

        if (this.chartCanvas) {
            this.initChart();
        }
    }

    private initChart(): void {
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        const config: ChartConfiguration<'line'> = {
            type: 'line',
            data: {
                labels: this.chartLabels,
                datasets: [
                    {
                        label: 'Dons',
                        data: this.donationsData,
                        borderColor: '#1445AF',
                        backgroundColor: 'rgba(20, 69, 175, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'Adhésions',
                        data: this.membersData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleFont: {
                            family: "'Inter', sans-serif",
                            size: 14,
                        },
                        bodyFont: {
                            family: "'Inter', sans-serif",
                            size: 13,
                        },
                        padding: 12,
                        cornerRadius: 8,
                    },
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                            },
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)',
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                            },
                        },
                    },
                },
            },
        };

        this.chart = new Chart(ctx, config);
    }

    getLast6Months(): string[] {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const result: string[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            result.push(months[date.getMonth()]);
        }

        return result;
    }

    logout(): void {
        sessionStorage.removeItem('adminToken');
        this.router.navigate(['/admin/login']);
    }

    goToDonation(id: string): void {
        this.router.navigate(['/admin/don', id]);
    }

    goToOrder(id: string): void {
        this.router.navigate(['/admin/produit', id]);
    }

    // === STATUS HELPERS ===
    getStatusClass(status: string): string {
        switch (status) {
            case PaymentStatus.COMPLETED:
            case PaymentStatus.EXEMPTED:
                return 'activity-item__status--success';
            case PaymentStatus.PENDING:
                return 'activity-item__status--warning';
            case PaymentStatus.FAILURE:
                return 'activity-item__status--danger';
            default:
                return 'activity-item__status--danger';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case PaymentStatus.COMPLETED:
                return 'Payé';
            case PaymentStatus.EXEMPTED:
                return 'Exempté';
            case PaymentStatus.PENDING:
                return 'En attente';
            case PaymentStatus.FAILURE:
                return 'Échoué';
            default:
                return 'Inconnu';
        }
    }
}
