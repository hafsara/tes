import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  json = {
    title: "Title test",
    description: "desc test",
    questions: [
      { label: "Text titre", type: "text", options: [] },
      { label: "Multichoice example", type: "multipleChoice", options: ["Option 1", "Option 2"]},
      { label: "Checkbox example", type: "checkbox", options: ["Option A", "Option B"] },
      { label: "Dropdown example", type: "dropdown", options: ["Option X", "Option Y"] }
    ]
  };
}
