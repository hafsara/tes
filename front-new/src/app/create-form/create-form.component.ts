import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
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
  currentStep = 0;
  form: FormContainer = {
    title: '',
    description: '',
    userEmail: '',
    managerEmail: '',
    escalation: false,
    questions: [{ text: '', type: 'multipleChoice', options: ['Option 1'] }]
  };
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  onStepChange(event: any): void {
    this.currentStep = event as number;
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
        this.emailPattern.test(this.form.userEmail || '')
        //(!this.form.escalation || (this.form.managerEmail && this.emailPattern.test(this.form.managerEmail || '')))
      );
    } else if (this.currentStep === 1) {
      return this.form.questions.every(q => q.text.trim() !== '');
    }
    return true;
  }

  addQuestion() {
    this.form.questions.push({ text: '', type: 'multipleChoice', options: ['Option 1'] });
  }

  addOption(questionIndex: number) {
    this.form.questions[questionIndex].options.push(`Option ${this.form.questions[questionIndex].options.length + 1}`);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.form.questions[questionIndex].options.splice(optionIndex, 1);
  }

  toggleEscalation() {
    if (!this.form.escalation) {
      this.form.managerEmail = ''; // Réinitialise l'email du manager si l'escalade est désactivée
    }
  }

  submitForm() {
    console.log("Formulaire soumis :", this.form);
  }
}
