import { Component } from '@angular/core';

interface Question {
  text: string;
  type: 'text' | 'multiple-choice' | 'checkbox';
  options?: string[];
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  title: string = '';
  description: string = '';
  userEmail: string = '';
  managerEmail: string = '';
  escalation: boolean = false;

  questions: Question[] = [];

  addQuestion(type: 'text' | 'multiple-choice' | 'checkbox') {
    const newQuestion: Question = {
      text: '',
      type: type,
      options: type === 'multiple-choice' || type === 'checkbox' ? [''] : undefined
    };
    this.questions.push(newQuestion);
  }

  addOption(questionIndex: number) {
    if (this.questions[questionIndex].options) {
      this.questions[questionIndex].options.push('');
    }
  }

  removeOption(questionIndex: number, optionIndex: number) {
    if (this.questions[questionIndex].options) {
      this.questions[questionIndex].options.splice(optionIndex, 1);
    }
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  saveForm() {
    const formData = {
      title: this.title,
      description: this.description,
      userEmail: this.userEmail,
      managerEmail: this.managerEmail,
      escalation: this.escalation,
      questions: this.questions
    };
    console.log('Form data:', formData);
    // Ici, vous pouvez ajouter le code pour envoyer les données au backend via une requête HTTP
  }
}
