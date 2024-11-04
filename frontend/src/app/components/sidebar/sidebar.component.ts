import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() viewSelected = new EventEmitter<string>();

  selectView(view: string) {
    this.viewSelected.emit(view);
  }
}
