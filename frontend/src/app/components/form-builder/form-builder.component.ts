import { Component, Input } from '@angular/core';
import { Question } from '../../utils/question-formatter';

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss']
})
export class FormBuilderComponent {
  @Input() form!: { questions: Question[] };
  @Input() showErrors: boolean = false;

  questionTypes = [
    { label: 'Radio Button', value: 'radioButton' },
    { label: 'Checkboxes', value: 'checkbox' },
    { label: 'Drop-down list', value: 'dropdown' },
    { label: 'Text', value: 'text' }
  ];

  onQuestionTypeChange(question: Question) {
    if (question.type === 'text') {
      question.options = [];
    } else if (question.options.length === 0) {
      question.options = ['Option 1'];
    }
  }

  addQuestion() {
    this.form.questions.push({
      label: '',
      type: 'text',
      options: [],
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
      ...questionToDuplicate,
      options: [...questionToDuplicate.options],
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

  trackByIndex(index: number, item: any): number {
    return index;
  }
}
