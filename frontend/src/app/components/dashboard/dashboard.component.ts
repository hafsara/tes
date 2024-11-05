import { Component, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { FormService } from '../../services/form.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  menuItems: any[];
  forms!: any[];
  showCreateFormFlag = false;
  loading: boolean = false;
  searchValue: string | undefined;
  selectedForm!: any[];

  constructor(private formService: FormService) {
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

  ngOnInit() {
    const status = 'open';
    this.formService.getFormContainerByStatus(status).subscribe(
      data => {
        this.forms = data;
        this.loading = false;
        console.log(data)
      },
      error => {
        console.error('Error fetching form data:', error);
        this.loading = false;
      }
    );

  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }

  getSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    switch (status) {
      case 'unqualified':
        return 'danger';
      case 'qualified':
        return 'success';
      case 'new':
        return 'info';
      case 'negotiation':
        return 'warning';
      default:
        return undefined;
    }
  }

  onMenuItemClick(status: string) {
    console.log(`${status} selected`);
  }

  toggleCreateForm() {
    this.showCreateFormFlag = !this.showCreateFormFlag;
  }
  onRowSelect(event: any) {
    console.log("test");
  }
}
