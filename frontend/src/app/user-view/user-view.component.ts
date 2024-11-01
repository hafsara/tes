import { Component, Input, OnInit } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
  response?: string;
  selectedOptions?: string[];
  primeNgOptions?: { label: string; value: string }[];
}

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  @Input() formData: {
    title: string;
    description: string;
    questions: Question[];
  } = { title: '', description: '', questions: [] }; // Default initialization

  ngOnInit(): void {
    // Populate primeNgOptions for PrimeNG components
    this.formData.questions.forEach(question => {
      question.primeNgOptions = question.options.map(opt => ({ label: opt, value: opt }));
    });
  }

  onSubmit() {
    console.log("Form Data:", this.formData);
  }
}
