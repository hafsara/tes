import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-form-response-preview',
  templateUrl: './form-response-preview.component.html',
  styleUrls: ['./form-response-preview.component.scss']
})
export class PreviewFormResponseComponent implements OnInit {
  @Input() questions: any[] = [];

  ngOnInit() {
    this.formatDropdownOptions();
  }

  formatDropdownOptions() {
    this.questions.forEach(question => {
      if (question.type === 'dropdown') {
        question.formattedOptions = question.options.map((option: string) => ({
          label: option,
          value: option
        }));
      }
    });
  }
}
