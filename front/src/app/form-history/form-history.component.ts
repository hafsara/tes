import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-history',
  templateUrl: './form-history.component.html',
  styleUrls: ['./form-history.component.scss']
})
export class FormHistoryComponent {
  @Input() formHistory: any[] = [];
}
