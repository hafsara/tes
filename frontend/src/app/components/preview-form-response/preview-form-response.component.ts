import { Component, Input, OnInit } from '@angular/core';
      import { formatQuestions } from '../../utils/question-formatter';

@Component({
  selector: 'app-preview-form-response',
  templateUrl: './preview-form-response.component.html',
  styleUrls: ['./preview-form-response.component.scss']
})
export class PreviewFormResponseComponent implements OnInit {
  @Input() questions: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.questions = formatQuestions(this.questions);
  }
}
