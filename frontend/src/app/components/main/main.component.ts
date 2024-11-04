import { Component } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  currentView: string = 'dashboard';

  changeView(view: string) {
    this.currentView = view;
  }
}
