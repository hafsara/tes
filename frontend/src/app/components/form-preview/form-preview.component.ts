import { Component, Input, OnInit } from '@angular/core';
import { Question, formatQuestions } from '../../utils/question-formatter';

@Component({
  selector: 'app-form-preview',
  templateUrl: './form-preview.component.html',
})
export class FormPreviewComponent implements OnInit {
  @Input() formQuestions!: {
    questions: Question[];
    };

  ngOnInit() {}
}
