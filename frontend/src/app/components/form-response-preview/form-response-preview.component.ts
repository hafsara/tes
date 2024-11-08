import { Component, Input, OnInit } from '@angular/core';
      import { formatQuestions } from '../../utils/question-formatter';

@Component({
  selector: 'app-form-response-preview',
  templateUrl: './form-response-preview.component.html',
  styleUrls: ['./form-response-preview.component.scss']
})
export class PreviewFormResponseComponent implements OnInit {
  @Input() questions: any[] = [];

  constructor() { }

  ngOnInit(): void {}
}
