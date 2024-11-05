import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  menuItems: any[];
  showCreateFormFlag = false;
  constructor() {
    this.menuItems = [
      {
        label: 'To be checked',
        icon: 'pi pi-verified',
        command: () => this.onMenuItemClick('To be checked'),
      },
      {
        label: 'In progress',
        icon: 'pi pi-star',
        command: () => this.onMenuItemClick('In progress'),
      },
      {
        label: 'Reminder',
        icon: 'pi pi-refresh',
        command: () => this.onMenuItemClick('Reminder'),
      },
      {
        label: 'Escalate',
        icon: 'pi pi-flag',
        command: () => this.onMenuItemClick('Escalate'),
      }
    ];
  }

  onMenuItemClick(status: string) {
    console.log(`${status} selected`);
    // Implémenter la logique de navigation ou mise à jour de contenu ici
  }

  toggleCreateForm() {
    this.showCreateFormFlag = !this.showCreateFormFlag;
  }
}


