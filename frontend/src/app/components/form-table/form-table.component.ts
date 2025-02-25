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
  @Output() formSelected = new EventEmitter<string>();

  filterDates: Date[] = [];
  selectedForms!: any[];
  items: MenuItem[];
  minDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  maxDate: Date = new Date();

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

  filterGlobal(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement;
    table.filterGlobal(input.value, 'contains');
  }

  clear(table: Table): void {
    table.clear();
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
}
