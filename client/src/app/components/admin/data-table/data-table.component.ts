import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { PaymentStatus } from '@common/enums/payment-status';

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    type?: 'text' | 'number' | 'date' | 'status' | 'currency';
    width?: string;
    render?: (value: any, row: any) => string;
}

export interface TableFilter {
    key: string;
    value: string;
    type: 'text' | 'select' | 'date';
    options?: { label: string; value: string }[];
}

export type SortDirection = 'asc' | 'desc' | null;

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './data-table.component.html',
    styleUrl: './data-table.component.scss',
})
export class DataTableComponent implements OnChanges {
    @Input() data: any[] = [];
    @Input() columns: TableColumn[] = [];
    @Input() title: string = '';
    @Input() loading: boolean = false;
    @Input() selectable: boolean = true;
    @Input() exportable: boolean = true;
    @Input() searchable: boolean = true;
    @Input() pageSizes: number[] = [10, 25, 50];
    @Input() emptyMessage: string = 'Aucune donnée disponible';
    @Input() emptyIcon: string = 'fas fa-inbox';

    @Output() rowClick = new EventEmitter<any>();
    @Output() selectionChange = new EventEmitter<any[]>();

    // State
    filteredData: any[] = [];
    displayedData: any[] = [];
    searchTerm: string = '';
    sortColumn: string | null = null;
    sortDirection: SortDirection = null;
    selectedRows: Set<any> = new Set();
    allSelected: boolean = false;

    // Pagination
    currentPage: number = 1;
    pageSize: number = 10;
    totalPages: number = 1;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            this.applyFilters();
        }
    }

    // === SEARCH & FILTER ===
    onSearch(): void {
        this.currentPage = 1;
        this.applyFilters();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.currentPage = 1;
        this.applyFilters();
    }

    applyFilters(): void {
        let result = [...this.data];

        // Search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter((row) =>
                this.columns.some((col) => {
                    const value = this.getNestedValue(row, col.key);
                    return value?.toString().toLowerCase().includes(term);
                }),
            );
        }

        // Sort
        if (this.sortColumn && this.sortDirection) {
            result.sort((a, b) => {
                const aVal = this.getNestedValue(a, this.sortColumn!);
                const bVal = this.getNestedValue(b, this.sortColumn!);

                if (aVal === bVal) return 0;
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                const comparison = aVal < bVal ? -1 : 1;
                return this.sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        this.filteredData = result;
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
        this.updateDisplayedData();
    }

    updateDisplayedData(): void {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.displayedData = this.filteredData.slice(start, end);
    }

    // === SORTING ===
    sort(column: TableColumn): void {
        if (!column.sortable) return;

        if (this.sortColumn === column.key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : this.sortDirection === 'desc' ? null : 'asc';
            if (!this.sortDirection) this.sortColumn = null;
        } else {
            this.sortColumn = column.key;
            this.sortDirection = 'asc';
        }

        this.applyFilters();
    }

    getSortIcon(column: TableColumn): string {
        if (this.sortColumn !== column.key) return 'fas fa-sort';
        return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }

    // === SELECTION ===
    toggleSelectAll(): void {
        if (this.allSelected) {
            this.selectedRows.clear();
        } else {
            this.displayedData.forEach((row) => this.selectedRows.add(row));
        }
        this.allSelected = !this.allSelected;
        this.selectionChange.emit(Array.from(this.selectedRows));
    }

    toggleRowSelection(row: any, event: Event): void {
        event.stopPropagation();
        if (this.selectedRows.has(row)) {
            this.selectedRows.delete(row);
        } else {
            this.selectedRows.add(row);
        }
        this.allSelected = this.displayedData.every((r) => this.selectedRows.has(r));
        this.selectionChange.emit(Array.from(this.selectedRows));
    }

    isSelected(row: any): boolean {
        return this.selectedRows.has(row);
    }

    clearSelection(): void {
        this.selectedRows.clear();
        this.allSelected = false;
        this.selectionChange.emit([]);
    }

    // === PAGINATION ===
    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.updateDisplayedData();
        this.allSelected = this.displayedData.every((r) => this.selectedRows.has(r));
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
        this.updateDisplayedData();
    }

    getVisiblePages(): number[] {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    // === EXPORT ===
    exportCSV(): void {
        const headers = this.columns.map((col) => col.label);
        const rows = this.filteredData.map((row) => this.columns.map((col) => this.formatCellValue(row, col)));

        let csv = headers.join(',') + '\n';
        rows.forEach((row) => {
            csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        FileSaver.saveAs(blob, `${this.title || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    }

    exportExcel(): void {
        const headers = this.columns.map((col) => col.label);
        const rows = this.filteredData.map((row) => this.columns.map((col) => this.formatCellValue(row, col)));

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        FileSaver.saveAs(blob, `${this.title || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // === ROW CLICK ===
    onRowClick(row: any): void {
        this.rowClick.emit(row);
    }

    // === HELPERS ===
    getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }

    formatCellValue(row: any, column: TableColumn): string {
        const value = this.getNestedValue(row, column.key);

        if (column.render) {
            return column.render(value, row);
        }

        if (value === null || value === undefined) return '';

        switch (column.type) {
            case 'date':
                return new Date(value).toLocaleDateString('fr-FR');
            case 'currency':
                return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
            case 'number':
                return new Intl.NumberFormat('fr-FR').format(value);
            default:
                return String(value);
        }
    }

    getCellValue(row: any, column: TableColumn): any {
        return this.getNestedValue(row, column.key);
    }

    // === STATUS HELPERS ===
    getStatusClass(status: string): string {
        switch (status) {
            case PaymentStatus.COMPLETED:
            case PaymentStatus.EXEMPTED:
                return 'admin-badge--success';
            case PaymentStatus.PENDING:
                return 'admin-badge--warning';
            case PaymentStatus.FAILURE:
                return 'admin-badge--danger';
            default:
                return 'admin-badge--danger'; // Par défaut, considéré comme échec
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
