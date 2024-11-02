import { Component, Input, OnInit } from '@angular/core';
import { Question, formatQuestions } from '../../utils/question-formatter';
import { FormService } from '../../services/form.service';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  @Input() formData!: {
    title: string;
    description: string;
    questions: Question[];
  };

  constructor(private formService: FormService) {}
  validationErrors: string[] = [];

  ngOnInit() {
    this.formData.questions = formatQuestions(this.formData.questions);
  }

  isChecked(selectedOptions: string[], option: string): boolean {
    return selectedOptions.includes(option);
  }

  toggleOption(question: Question, option: string): void {
    question.selectedOptions = question.selectedOptions || [];
    const index = question.selectedOptions.indexOf(option);
    if (index > -1) {
      question.selectedOptions.splice(index, 1);
    } else {
      question.selectedOptions.push(option);
    }
  }

  onSubmit(): void {
    this.validationErrors = []; // Reset errors

    this.formData.questions.forEach((question, index) => {
      const questionError = `Please respond to question ${index + 1}: ${question.label}`;

      if (question.isRequired) {
        if (question.type === 'text' && (!question.response || question.response.trim() === '')) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'multipleChoice' && !question.response) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'checkbox' && (!question.selectedOptions || question.selectedOptions.length === 0)) {
          this.validationErrors.push(`Please select at least one option for question ${index + 1}: ${question.label}`);
        } else if (question.type === 'dropdown' && !question.response) {
          this.validationErrors.push(questionError);
        }
      }
    });

    if (this.validationErrors.length > 0) {
      console.log("Validation failed:", this.validationErrors);
    } else {
      console.log("Form submitted successfully:", this.formData);
    }
  }
}
