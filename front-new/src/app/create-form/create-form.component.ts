import { Component } from '@angular/core';

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  currentStep = 0;
  showErrors = false;

  steps = [
    { label: 'Configuration du Form Container' },
    { label: 'Création du Formulaire' },
    { label: 'Récapitulatif' }
  ];

  form = {
    title: '',
    description: '',
    userEmail: '',
    escalation: false,
    managerEmail: ''
  };

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

validateCurrentStep(): boolean {
  if (this.currentStep === 0) {
    return (
      this.form.title.trim() !== '' &&
      this.form.description.trim() !== '' &&
      this.emailPattern.test(this.form.userEmail || '')
      //&&
      //(!this.form.escalation ||
       // (this.form.managerEmail && this.emailPattern.test(this.form.managerEmail || '')))
    );
  }
  return true;
}

  nextStep() {
    if (this.validateCurrentStep()) {
      this.showErrors = false;
      this.currentStep++;
    } else {
      this.showErrors = true;
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showErrors = false;
    }
  }
}
