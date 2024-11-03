import { Component, Input, Output, EventEmitter } from '@angular/core';

interface Question {
  label: string;
  type: string;
  options: string[];
  isRequired: boolean;
}

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss']
})
export class FormBuilderComponent {
  @Input() form!: { questions: Question[] };
  @Input() showErrors: boolean = false;
  @Output() onStepValid = new EventEmitter<boolean>();

  questionTypes = [
    { label: 'Multiple choices', value: 'multipleChoice' },
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

  validateQuestions(): boolean {
    const isValid = this.form.questions.every(question => {
      const isQuestionTextValid = question.label.trim() !== '';
      const areOptionsValid = question.type === 'text' || (question.options.length > 0 && question.options.every(option => option.trim() !== ''));
      return isQuestionTextValid && areOptionsValid;
    });
    this.onStepValid.emit(isValid);
    return isValid;
  }

  removeQuestion(index: number) {
    if (this.form.questions.length > 1) {
      this.form.questions.splice(index, 1);
    }
  }

  duplicateQuestion(index: number) {
    const questionToDuplicate = this.form.questions[index];
    this.form.questions.splice(index + 1, 0, {
      ...questionToDuplicate
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
