import { Component } from '@angular/core';

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  formTitle = '';
  formDescription = '';
  userEmail = '';
  managerEmail = '';
  escalationEnabled = false;

  questions = [
    {
      text: '',
      type: 'multiple',
      options: ['Option 1']
    }
  ];

  addQuestion() {
    this.questions.push({
      text: '',
      type: 'multiple',
      options: ['Option 1']
    });
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  addOption(questionIndex: number) {
    this.questions[questionIndex].options.push(`Option ${this.questions[questionIndex].options.length + 1}`);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options.splice(optionIndex, 1);
  }

  saveForm() {
    // Logique de sauvegarde du formulaire
    console.log({
      title: this.formTitle,
      description: this.formDescription,
      email: this.userEmail,
      managerEmail: this.managerEmail,
      escalation: this.escalationEnabled,
      questions: this.questions
    });
  }
}
