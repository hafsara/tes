import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-container-preview',
  templateUrl: './form-container-preview.component.html',
  styleUrl: './form-container-preview.component.scss'
})
export class FormContainerPreviewComponent {
  @Input() fromContainer!: any;
}
