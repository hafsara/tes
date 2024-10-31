// create-form.component.ts
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
  escalate: boolean;
  questions: Question[];
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  currentStep = 0;
  showErrors = false;
  questionTypes = [
        { label: 'Choix multiples', value: 'multipleChoice' },
        { label: 'Cases à cocher', value: 'checkbox' },
        { label: 'Liste déroulante', value: 'dropdown' },
        { label: 'Text', value: 'text' }
  ];

  steps = [
      undefined,
    { label: 'Configuration du Form Container' },
    { label: 'Création du Formulaire' },
    { label: 'Récapitulatif' }
  ];

  form: FormContainer = {
    title: '',
    description: '',
    userEmail: '',
    managerEmail: '',
    escalate: false,
    questions: [
      {
        text: '',
        type: 'Text',
        options: ['Option 1'],
        isRequired: true
      }
    ]
  };

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  addQuestion() {
      this.form.questions.push({
        text: '',
        type: 'multipleChoice',
        options: ['Option 1'],
        isRequired: true
      });
  }

  removeQuestion(index: number) {
    if (this.form.questions.length > 1) {
      this.form.questions.splice(index, 1);
    }
  }

  duplicateQuestion(index: number) {
    const questionToDuplicate = this.form.questions[index];
    this.form.questions.splice(index + 1, 0, {
      text: questionToDuplicate.text,
      type: questionToDuplicate.type,
      options: [...questionToDuplicate.options],
      isRequired: questionToDuplicate.isRequired
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

validateCurrentStep(): boolean {
  if (this.currentStep === 0) {
    return (
      this.form.title.trim() !== '' &&
      this.form.description.trim() !== '' &&
      this.emailPattern.test(this.form.userEmail || '')
      //&&
      //(!this.form.escalate ||
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
