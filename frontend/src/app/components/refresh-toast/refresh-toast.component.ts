import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-refresh-toast',
  templateUrl: './refresh-toast.component.html',
  styleUrls: ['./refresh-toast.component.scss']
})
export class RefreshToastComponent {
  @Output() refreshTriggered = new EventEmitter<void>();

  handleToastClick(): void {
    this.refreshTriggered.emit();
  }
}
