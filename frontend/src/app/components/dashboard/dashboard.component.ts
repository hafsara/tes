import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  statuses: MenuItem[] | undefined;
  showCreateFormFlag = false;
    ngOnInit() {
        this.statuses = [
            { label: 'To validate' },
            { label: 'En cours' },
            { label: 'Relancé'},
            { label: 'Escaladé' },
            { label: 'Expiré'}
        ];
    }

  toggleCreateForm() {
    this.showCreateFormFlag = !this.showCreateFormFlag;
  }
}
