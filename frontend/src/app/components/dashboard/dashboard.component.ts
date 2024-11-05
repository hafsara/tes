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
        label: 'To validate',
        icon: 'pi pi-envelope',
        command: () => this.onMenuItemClick('To validate'),
      },
      {
        label: 'En cours',
        icon: 'pi pi-star',
        command: () => this.onMenuItemClick('En cours'),
      },
      {
        label: 'Relancé',
        icon: 'pi pi-refresh',
        command: () => this.onMenuItemClick('Relancé'),
      },
      {
        label: 'Escaladé',
        icon: 'pi pi-flag',
        command: () => this.onMenuItemClick('Escaladé'),
      },
      {
        label: 'Expiré',
        icon: 'pi pi-send',
        command: () => this.onMenuItemClick('Expiré'),
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


