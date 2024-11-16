import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-form-table',
  templateUrl: './form-table.component.html',
  styleUrl: './form-table.component.scss'
})
export class FormTableComponent {
  @Input() forms: any[] = [];
  @Input() loading = false;

  @Output() formSelected = new EventEmitter<string>();

  filterDates: Date[] = [];
  minDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  maxDate: Date = new Date();

  filterGlobal(table: Table, event: Event): void {
    const input = event.target as HTMLInputElement;
    table.filterGlobal(input.value, 'contains');
  }

  clear(table: Table): void {
    table.clear();
  }

  selectForm(accessToken: string): void {
    this.formSelected.emit(accessToken);
  }
}
