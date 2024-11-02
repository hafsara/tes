// form-preview.component.ts
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

function formatQuestions(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    isRequired: question.isRequired ?? true,
    selectedOptions: question.selectedOptions || [],
    formattedOptions: question.options.map((opt) => ({ label: opt, value: opt }))
  }));
}

@Component({
  selector: 'app-form-preview',
  templateUrl: './form-preview.component.html',
})
export class FormPreviewComponent implements OnInit {
  @Input() formQuestions!: {
    questions: Question[];
    };

  ngOnInit() {
    this.formQuestions.questions = formatQuestions(this.formQuestions.questions);
  }
}
