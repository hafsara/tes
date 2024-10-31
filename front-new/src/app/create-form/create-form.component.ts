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
  form: FormContainer = {
    title: '',
    description: '',
    userEmail: '',
    managerEmail: '', // Initialized as an empty string to avoid undefined issues
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

  addQuestion() {
    if (this.isFormContainerValid()) {
      this.form.questions.push({
        text: '',
        type: 'multipleChoice',
        options: ['Option 1'],
        isRequired: true
      });
    }
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

  toggleEscalation() {
    if (!this.form.escalation) {
      this.form.managerEmail = ''; // Clear manager email if escalation is disabled
    }
  }

  isFormContainerValid(): boolean {
    return (
      this.form.title.trim() !== '' &&
      this.form.description.trim() !== '' &&
      this.emailPattern.test(this.form.userEmail)
      // (!this.form.escalation || (this.form.managerEmail && this.emailPattern.test(this.form.managerEmail)))
    );
  }

  submitForm() {
    if (this.isFormContainerValid()) {
      const jsonForm = JSON.stringify(this.form);
      console.log('Formulaire soumis :', jsonForm);
      // Send to the backend here with the generated JSON (e.g., via HTTP POST)
    } else {
      alert("Veuillez remplir tous les champs obligatoires avec des formats valides.");
    }
  }
}
