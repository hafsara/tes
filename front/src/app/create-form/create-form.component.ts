import { Component } from '@angular/core';

interface Question {
  text: string;
  options: string[];
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  questions: Question[] = [];

  addQuestion() {
    this.questions.push({
      text: '',
      options: ['']
    });
  }

  addOption(questionIndex: number) {
    this.questions[questionIndex].options = this.questions[questionIndex].options || [];
    this.questions[questionIndex].options.push('');
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options.splice(optionIndex, 1);
  }

  removeQuestion(questionIndex: number) {
    this.questions.splice(questionIndex, 1);
  }

  saveForm() {
    console.log('Form data:', this.questions);
    // Sauvegarder le formulaire ou envoyer les données
  }
}
