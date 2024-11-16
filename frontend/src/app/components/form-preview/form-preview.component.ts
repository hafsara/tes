import { Component, Input, OnInit } from '@angular/core';
import { Question, formatQuestions } from '../../utils/question-formatter';

@Component({
  selector: 'app-form-preview',
  templateUrl: './form-preview.component.html',
  styleUrls: ['./form-preview.component.scss']
})
export class FormPreviewComponent implements OnInit {
  @Input() formQuestions!: {
    questions: Question[];
  };

  ngOnInit(): void {
    this.formatQuestions();
  }

  formatQuestions(): void {
    this.formQuestions.questions.forEach((question) => {
      question.formattedOptions = question.options.map((option: string) => ({
        label: option,
        value: option,
      }));
    });
  }
}
