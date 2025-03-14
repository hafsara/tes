import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dashboard-table',
  templateUrl: './dashboard-table.component.html'
})
export class DashboardTableComponent {
  @Input() forms: any[] = [];
  @Input() totalCount: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() isFilterVisible: boolean = false;

  @Output() pageChanged = new EventEmitter<{ page: number; limit: number }>();
  @Output() sortChanged = new EventEmitter<string>();
  @Output() filterToggled = new EventEmitter<void>();
  @Output() filterChanged = new EventEmitter<any>();
  @Output() formSelected = new EventEmitter<string>();

  pageSizeOptions: number[] = [10, 25, 50];
  currentFilters: any = {};

  handlePageChange(event: { page: number; limit: number }): void {
    this.pageChanged.emit(event);
  }

  handleSortChange(order: string): void {
    this.sortChanged.emit(order);
  }

  toggleFilter(): void {
    this.filterToggled.emit();
  }

  handleFilterUpdate(filters: any): void {
    this._handleFilterChange(filters)
    this.filterChanged.emit(this.currentFilters);
  }

  private _handleFilterChange(filters: any): void {
      if (!filters) return;

      this.currentFilters = {
          ...this.currentFilters,
          ...(Array.isArray(filters) ? {
              references: filters.filter((t: string) => t.startsWith('ref: '))
                  .map((t: string) => t.replace('ref: ', '')),
              expired: filters.includes('EXPIRED')
          } : {}),

          ...(typeof filters === 'object' ? {
              title: filters.title !== undefined ? filters.title.trim() || null : this.currentFilters.title,
              user_email: filters.user_email !== undefined ? filters.user_email.trim() || null : this.currentFilters.user_email,
              campaign_name: filters.campaign_name !== undefined ? filters.campaign_name.trim() || null : this.currentFilters.campaign_name,

              dateRange: (filters.dateRange && Array.isArray(filters.dateRange) && filters.dateRange.length === 2)
                  ? { start: filters.dateRange[0], end: filters.dateRange[1] }
                  : null
          } : {})
      };
  }

  handleFormSelection(accessToken: string): void {
    this.formSelected.emit(accessToken);
  }
}
