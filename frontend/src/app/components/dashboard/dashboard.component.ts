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
  representatives!: any[];
  statuses!: any[];
  customerService!: any[];
  loading: boolean = false;
  searchValue: string | undefined;
  activityValues: number[] = [0, 100];

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
      country: {
        name: 'mar',
        code: 'ma'
      },
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

        this.representatives = [
            { name: 'Amy Elsner', image: 'amyelsner.png' },
            { name: 'Anna Fali', image: 'annafali.png' },
            { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
            { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
            { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
            { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
            { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
            { name: 'Onyama Limba', image: 'onyamalimba.png' },
            { name: 'Stephen Shaw', image: 'stephenshaw.png' },
            { name: 'Xuxue Feng', image: 'xuxuefeng.png' }
        ];


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
}
