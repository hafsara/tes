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
    userEmail: "useremail@test.com",
    reference: "ref",
    managerEmail: "manageremail@test.com",
    escalate: true,
    reminderDelayDay: 3,
    questions: [
      { text: "Text titre", type: "text", options: [], isRequired: true },
      { text: "Text titre 2", type: "text", options: [], isRequired: true },
      { text: "Multichoices test", type: "multipleChoice", options: ["Option 1", "Option 2"], isRequired: true },
      { text: "drop down list", type: "dropdown", options: ["Option 1", "Option 2", "Option 3", "Option 4"], isRequired: true },
      { text: "checkboxes", type: "checkbox", options: ["Option 1"], isRequired: true }
    ]
  };
}
