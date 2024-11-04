import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  showCreateFormFlag = false;
  statuses = ['To validate 10', 'En cours', 'Relancé', 'Escaladé', 'Expiré'];

  toggleCreateForm() {
    this.showCreateFormFlag = !this.showCreateFormFlag;
  }
}
