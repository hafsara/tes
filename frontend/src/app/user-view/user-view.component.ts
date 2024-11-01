import { Component, Input, OnInit } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
  isRequired?: boolean;
  response?: string;
  selectedOptions?: string[];
  formattedOptions?: { label: string; value: string }[];
}

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

  validationErrors: string[] = [];

  ngOnInit() {
    // Format options and initialize selectedOptions for each question in ngOnInit
    this.formData.questions = this.formData.questions.map((question) => ({
      ...question,
      isRequired: question.isRequired ?? true,
      selectedOptions: question.selectedOptions || [], // Initialize as an empty array if undefined
      formattedOptions: question.options.map((opt) => ({ label: opt, value: opt }))
    }));
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
      const questionError = `Please respond to question ${index + 1}: ${question.text}`;

      if (question.isRequired) {
        if (question.type === 'text' && (!question.response || question.response.trim() === '')) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'multipleChoice' && !question.response) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'checkbox' && (!question.selectedOptions || question.selectedOptions.length === 0)) {
          this.validationErrors.push(`Please select at least one option for question ${index + 1}: ${question.text}`);
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
