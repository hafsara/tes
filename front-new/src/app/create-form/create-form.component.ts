import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
  isRequired: boolean;
}

interface FormContainer {
  title: string;
  description: string;
  userEmail: string;
  managerEmail?: string;
  escalation: boolean;
  questions: Question[];
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  steps = [
    { label: 'Configuration' },
    { label: 'Création du Formulaire' },
    { label: 'Récapitulatif' }
  ];

  questionTypes = [
    { label: 'Choix multiples', value: 'multipleChoice' },
    { label: 'Cases à cocher', value: 'checkbox' },
    { label: 'Liste déroulante', value: 'dropdown' },
    { label: 'Texte', value: 'text' }
  ];

  form: FormContainer = {
    title: '',
    description: '',
    userEmail: '',
    managerEmail: '',
    escalation: false,
    questions: [
      {
        text: '',
        type: 'multipleChoice',
        options: ['Option 1'],
        isRequired: true,
      }
    ]
  };

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  currentStep = 0;

  onStepChange(event: number): void {
    this.currentStep = event;
  }

  nextStep() {
    if (this.isCurrentStepValid()) {
      this.currentStep++;
    } else {
      alert("Veuillez remplir tous les champs obligatoires pour continuer.");
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep === 0) {
      return (
        this.form.title.trim() !== '' &&
        this.form.description.trim() !== '' &&
        this.emailPattern.test(this.form.userEmail)
      );
    } else if (this.currentStep === 1) {
      return this.form.questions.every(q => q.text.trim() !== '');
    }
    return true;
  }

  addQuestion() {
    this.form.questions.push({
      text: '',
      type: 'multipleChoice',
      options: ['Option 1'],
      isRequired: true
    });
  }

  addOption(questionIndex: number) {
    const optionNumber = this.form.questions[questionIndex].options.length + 1;
    this.form.questions[questionIndex].options.push(`Option ${optionNumber}`);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    if (this.form.questions[questionIndex].options.length > 1) {
      this.form.questions[questionIndex].options.splice(optionIndex, 1);
    }
  }

  toggleEscalation() {
    if (!this.form.escalation) {
      this.form.managerEmail = '';
    }
  }

  submitForm() {
    if (this.isFormContainerValid()) {
      const jsonForm = JSON.stringify(this.form);
      console.log('Formulaire soumis :', jsonForm);
    } else {
      alert("Veuillez remplir tous les champs obligatoires avec des formats valides.");
    }
  }

  isFormContainerValid(): boolean {
    return (
      this.form.title.trim() !== '' &&
      this.form.description.trim() !== '' &&
      this.emailPattern.test(this.form.userEmail)
    );
  }
}
