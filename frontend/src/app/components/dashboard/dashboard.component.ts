import { Component, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { FormService } from '../../services/form.service';
import { formatQuestions } from '../../utils/question-formatter';

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
  questions: any[] = [];
  showQuestions: boolean = false;

  constructor(private formService: FormService) {
    this.menuItems = [
      {
        label: 'To be checked',
        icon: 'pi pi-verified',
        command: () => this.onMenuItemClick('answered'),
      },
      {
        label: 'In progress',
        icon: 'pi pi-star',
        command: () => this.onMenuItemClick('open'),
      },
      {
        label: 'Reminder',
        icon: 'pi pi-refresh',
        command: () => this.onMenuItemClick('reminder'),
      },
      {
        label: 'Escalate',
        icon: 'pi pi-flag',
        command: () => this.onMenuItemClick('escalate'),
      }
    ];
  }

  ngOnInit() {
    this.loadForms('answered');
  }

  onMenuItemClick(status: string) {
    console.log(`${status} selected`);
    this.loadForms(status);
  }

  loadForms(status: string) {
    this.loading = true;
    this.formService.getFormContainersByStatus(status).subscribe(
      (data) => {
        this.forms = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors de la récupération des données', error);
        this.loading = false;
      }
    );
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }

  toggleCreateForm() {
    this.showCreateFormFlag = !this.showCreateFormFlag;
  }
  onRowSelect(form: any): void {
    console.log(form)
    this.selectedForm = form;
    this.loadQuestions(form.data.access_token);

  }

  loadQuestions(access_token: string): void {
    this.formService.getFormContainerByAccessToken(access_token).subscribe(
      (data) => {
        this.questions = formatQuestions(data.forms[0].questions);
        console.log('Questions:', this.questions);
         this.showQuestions = true;
      },
      (error) => {
        console.error('Error loading questions:', error);
      }
    );
  }

  backToTable() {
    this.showQuestions = false;
  }
}
