import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Output() menuItemSelected = new EventEmitter<string>();
  @Output() createFormClicked = new EventEmitter<void>();
  selectedMenuItem: number = 0;
  status:string = 'answered'
  menuItems: any[] = [];
  constructor() {
    this.initializeMenuItems();
  }

  onCreateFormClick(): void {
    this.createFormClicked.emit();
  }
  initializeMenuItems(): void {
    this.menuItems = [
      { label: 'To be checked', icon: 'pi pi-check-square', command: () => this.updateStatus('answered') },
      { label: 'Open', icon: 'pi pi-folder-open', command: () => this.updateStatus('open') },
      { label: 'Reminder', icon: 'pi pi-bell', command: () => this.updateStatus('reminder') },
      { label: 'Escalate', icon: 'pi pi-exclamation-triangle', command: () => this.updateStatus('escalate') },
      { label: 'Archived', icon: 'pi pi-book', command: () => this.updateStatus('validated') },
      { label: 'Canceled', icon: 'pi pi-times-circle', command: () => this.updateStatus('canceled') },
    ];
  }
   updateStatus(status: string): void{
   this.status = status
    }
  selectMenuItem(index: number): void {
    this.selectedMenuItem = index;
    this.menuItems[index].command();
    this.menuItemSelected.emit(this.status);

  }
}
