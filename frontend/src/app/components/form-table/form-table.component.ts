import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Table } from 'primeng/table';
import { Location } from '@angular/common';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-form-table',
  templateUrl: './form-table.component.html',
  styleUrl: './form-table.component.scss'
})
export class FormTableComponent {
  @Input() forms: any[] = [];
  @Input() totalCount: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50];
  @Output() formSelected = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<any>();
  @Output() filterChange = new EventEmitter<string[]>();
  @Output() toggleFilter = new EventEmitter<void>();
  @Output() sortChange = new EventEmitter<string>();

  filterDates: Date[] = [];
  selectedForms!: any[];
  items: MenuItem[];
  activeTags: string[] = [];

  constructor(private location: Location) {
    this.items = [
      { label: 'Export Json',
        icon: "pi pi-external-link",
        command: () => {
        this.exportSelectedToJson();
        }
      }
    ];
  }

  onPageChange(event: any): void {
    const currentPage = (event.first / event.rows) + 1;

    this.pageChange.emit({
      page: currentPage,
      limit: event.rows
    });
  }

  toggleTagFilter(tag: string): void {
    if (!this.activeTags.includes(tag)) {
      this.activeTags.push(tag);
    } else {
      this.activeTags = this.activeTags.filter(t => t !== tag);
    }
    this.filterChange.emit(this.activeTags);
  }

  onTagRemove(tag: string): void {
    this.activeTags = this.activeTags.filter(t => t !== tag);
    this.filterChange.emit(this.activeTags);
  }

  clear(table: Table): void {
    table.clear();
    this.activeTags = [];
    this.filterChange.emit(this.activeTags);
  }

  selectForm(accessToken: string, appName:string): void {
    const newUrl = `/dashboard/${appName}/load-form/${accessToken}`;
    this.location.go(newUrl);
    this.formSelected.emit(accessToken);
  }

  exportSelectedToCsv() {
      if (!this.selectedForms || this.selectedForms.length === 0) {
          return;
      }

      const csvRows = [];
      const headers = Object.keys(this.selectedForms[0]);
      csvRows.push(headers.join(','));

      this.selectedForms.forEach(form => {
          const values = headers.map(header => {
              const escaped = ('' + form[header]).replace(/"/g, '""');
              return `"${escaped}"`;
          });
          csvRows.push(values.join(','));
      });

      const csvString = csvRows.join('\n');

      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_data.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  exportSelectedToJson() {
      if (!this.selectedForms || this.selectedForms.length === 0) {
          return;
      }

      const jsonData = JSON.stringify(this.selectedForms, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  isExpired(form: any): boolean {
    return form.validated && new Date(form.archived_at) <= new Date();
  }

  onToggleFilter(): void {
    this.toggleFilter.emit();
  }

  onSort(event: any): void {
    const sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.sortChange.emit(sortOrder);
  }
}
