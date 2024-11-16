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
  filterDates: Date[] = [];
  minDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  maxDate: Date = new Date();
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];

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
      { label: 'Canceled', icon: 'pi pi-times-circle', command: () => this.onMenuItemClick('canceled') }
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
        this.checkAndLoadForms();
      }
    });
  }

  onSelectedAppIdsChange(selectedAppIds: string[]) {
    this.selectedApps = selectedAppIds;
    this.checkAndLoadForms();
  }

  checkAndLoadForms() {
    if (this.selectedApps.length > 0 && this.status) {
      this.loadForms(this.status);
    }
  }

  onAppOptionsLoaded(options: { name: string; token: string }[]) {
    this.appOptions = options;
  }

  onMenuItemClick(status: string) {
    this.status = status;
    this.currentView = 'loading';
    if (status==='validated'){
      this.loadValidatedForms()
    } else {
      this.loadForms(this.status);
    }
    this.location.go('/dashboard');
  }

  loadForms(status: string) {
      this.loading = true;
      const appIds = this.selectedApps.join(',');
      this.formService.getFormContainersByStatus(appIds, status).subscribe(
          (data) => {
              this.forms = data;
              this.currentView = 'table';
              this.loading = false;
          },
          (error) => {
              this.loading = false;
          }
      );
  }

  loadValidatedForms() {
    this.loading = true;
    const appIds = this.selectedApps.join(',');
    this.formService.getValidatedFormContainers(appIds).subscribe(
      (data) => {
        this.forms = data;
        this.currentView = 'table';
        this.loading = false;
      },
      (error) => {
        this.loading = false;
      }
    );
  }

  filterGlobal(table: Table, event: Event) {
    const input = event.target as HTMLInputElement;
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
        this.loading = false;
      }
    );
  }

  switchTo(view: string) {
    this.currentView = view;
    if (view === 'table') {
      this.loadForms(this.status);
    } else if(view === 'createForm'){
      this.location.go('/create-form');
    } else {
      this.location.go('/dashboard');
    }
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }
}
