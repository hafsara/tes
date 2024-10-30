import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-form-details',
  templateUrl: './form-details.component.html',
  styleUrls: ['./form-details.component.scss']
})
export class FormDetailsComponent {
  @Input() selectedForm: any;
  @Output() formUpdate = new EventEmitter<void>();

  createNewForm(): void {
    // Appel à la fonction pour créer un nouveau formulaire
    console.log('Creating new form');
    this.formUpdate.emit();
  }

  validateForm(): void {
    // Appel à la fonction pour valider le formulaire
    console.log('Validating form');
    this.formUpdate.emit();
  }
}
