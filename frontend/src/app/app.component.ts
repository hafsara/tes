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
      { text: "Text titre", type: "text", options: [], response: "" },
      { text: "Multichoice example", type: "multipleChoice", options: ["Option 1", "Option 2"], response: "" },
      { text: "Checkbox example", type: "checkbox", options: ["Option A", "Option B"], selectedOptions: [] },
      { text: "Dropdown example", type: "dropdown", options: ["Option X", "Option Y"], response: "" }
    ]
  };
}
