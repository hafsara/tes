import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  @Input() formData: any;

  ngOnInit() {
    this.prepareOptions();
  }

  // Prepare options in the format required by PrimeNG components
  prepareOptions() {
    this.formData.questions.forEach((question: any) => {
      if (question.options) {
        question.primeNgOptions = question.options.map((opt: string) => ({
          label: opt,
          value: opt
        }));
      }
    });
  }

  onSubmit() {
    console.log('Form submitted:', this.formData);
  }
}
