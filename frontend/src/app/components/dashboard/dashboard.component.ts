import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Table } from 'primeng/table';
import { FormService } from '../../services/form.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { formatQuestions } from '../../utils/question-formatter';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  menuItems: any[] = [];
  forms: any[] = [];
  formContainer: any = {};
  searchValue: string | undefined;
  currentView: string = 'loading';
  loading: boolean = false;
  status: string = 'answered';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formService: FormService,
    private location: Location
  ) {
    this.menuItems = [
      { label: 'To be checked', icon: 'pi pi-check-square', command: () => this.onMenuItemClick('answered') },
      { label: 'Open', icon: 'pi pi-folder-open', command: () => this.onMenuItemClick('open') },
      { label: 'Reminder', icon: 'pi pi-bell', command: () => this.onMenuItemClick('reminder') },
      { label: 'Escalate', icon: 'pi pi-exclamation-triangle', command: () => this.onMenuItemClick('escalate') },
      { label: 'Archived', icon: 'pi pi-book', command: () => this.onMenuItemClick('validated') },
    ];
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const accessToken = params.get('access_token');
      if (accessToken) {
        this.currentView = 'loading';
        this.loadFormDetails(accessToken);
      } else {
        this.currentView = 'loading';
        this.loadForms(this.status);
      }
    });
  }

  onMenuItemClick(status: string) {
    this.status = status;
    this.currentView = 'loading';
    this.loadForms(this.status);
  }

  loadForms(status: string) {
    this.loading = true;
    this.formService.getFormContainersByStatus(status).subscribe(
      (data) => {
        this.forms = data;
        this.currentView = 'table';
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors de la récupération des formulaires:', error);
        this.loading = false;
      }
    );
  }
filterGlobal(table: Table, event: Event) {
  const input = event.target as HTMLInputElement;
  console.log('Filter value:', input.value);
  table.filterGlobal(input.value, 'contains');
}


  loadFormDetails(access_token: string) {
    this.loading = true;
    this.formService.getFormContainerByAccessToken(access_token).subscribe(
      (data) => {
        if (data.forms) {
            data.forms.forEach((form: any) => {
              if (form.questions) {
                form.questions = formatQuestions(form.questions);
              }
            });
          }
        this.formContainer = data;
        this.formContainer.access_token = access_token;
        this.currentView = 'questions';
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors du chargement des détails du formulaire:', error);
        this.loading = false;
      }
    );
  }

  switchTo(view: string) {
    this.currentView = view;
    this.location.go('/dashboard');
    if (view === 'table') {
      this.loadForms(this.status);
    }
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }
}
