import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  formTitle = '';
  formDescription = '';
  questions: Question[] = [
    {
      text: '',
      type: 'text',
      options: []
    }
  ];

  addQuestion() {
    this.questions.push({
      text: '',
      type: 'text',
      options: []
    });
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
    }
  }

  duplicateQuestion(index: number) {
    const questionToDuplicate = this.questions[index];
    this.questions.splice(index + 1, 0, {
      text: questionToDuplicate.text,
      type: questionToDuplicate.type,
      options: [...questionToDuplicate.options]
    });
  }

  addOption(questionIndex: number) {
    this.questions[questionIndex].options.push(`Option ${this.questions[questionIndex].options.length + 1}`);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options.splice(optionIndex, 1);
  }

  onTypeChange(question: Question) {
    if (question.type === 'text') {
      question.options = [];
    } else if (!question.options.length) {
      question.options = ['Option 1'];
    }
  }

  saveForm() {
    console.log({
      title: this.formTitle,
      description: this.formDescription,
      questions: this.questions
    });
  }
}
