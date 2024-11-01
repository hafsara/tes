import { Component, Input, OnInit } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
  response?: string;
  selectedOptions?: string[];
  isRequired?: boolean;
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

  questionDropdownOptions: { [key: string]: { label: string, value: string }[] } = {};

  ngOnInit() {
    this.initializeOptions();
  }

  initializeOptions() {
    this.formData.questions.forEach((question) => {
      if (question.type === 'dropdown') {
        this.questionDropdownOptions[question.text] = question.options.map(opt => ({ label: opt, value: opt }));
      }
    });
  }

  onSubmit() {
    console.log('Submitted form data:', this.formData);
  }
}
