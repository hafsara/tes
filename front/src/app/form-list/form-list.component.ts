import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-form-list',
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.scss']
})
export class FormListComponent {
  @Input() formContainers: any[] = [];
  @Input() selectedForm: any;
  @Output() formSelected = new EventEmitter<any>();

  selectForm(form: any): void {
    this.formSelected.emit(form);
  }

  getStatusClass(status: string): string {
    return {
      'open': 'open',
      'validate': 'validate',
      'escalate': 'escalate'
    }[status] || 'open';
  }
}
