import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
  isRequired: boolean;
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  questions: Question[] = [
    { text: '', type: 'multipleChoice', options: ['Option 1'], isRequired: false }
  ];

  addQuestion() {
    this.questions.push({
      text: '',
      type: 'multipleChoice',
      options: ['Option 1'],
      isRequired: false
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
      options: [...questionToDuplicate.options],
      isRequired: questionToDuplicate.isRequired
    });
  }

  addOption(questionIndex: number) {
    const optionNumber = this.questions[questionIndex].options.length + 1;
    this.questions[questionIndex].options.push(`Option ${optionNumber}`);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    if (this.questions[questionIndex].options.length > 1) {
      this.questions[questionIndex].options.splice(optionIndex, 1);
    }
  }
}
