import { Component, OnInit } from '@angular/core';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  menuItems: any[];
  customers!: any[];
  showCreateFormFlag = false;
  statuses!: any[];
  loading: boolean = false;
  searchValue: string | undefined;
  selectedCustomer!: any[];

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

  ngOnInit() {
    this.customers = [{
      id: 1000,
      name: 'James Butt',
      company: 'Benton, John B Jr',
      date: '2015-09-13',
      status: 'unqualified',
      verified: true,
      activity: 17,
      representative: {
        name: 'Ioni Bowcher'
      },
      balance: 70663
    }];

    this.statuses = [
      { label: 'Unqualified', value: 'unqualified' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'New', value: 'new' },
      { label: 'Negotiation', value: 'negotiation' },
      { label: 'Renewal', value: 'renewal' },
      { label: 'Proposal', value: 'proposal' }
    ];
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
