import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormService } from '../../services/form.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  menuItems: any[] = [];
  forms: any[] = [];
  formContainer: any = {};
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];
  loading = false;
  currentView = 'loading';
  status = 'answered';

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private location: Location
  ) {
    this.initializeMenuItems();
  }

  ngOnInit(): void {
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

  initializeMenuItems(): void {
    this.menuItems = [
      { label: 'To be checked', icon: 'pi pi-check-square', command: () => this.updateStatus('answered') },
      { label: 'Open', icon: 'pi pi-folder-open', command: () => this.updateStatus('open') },
      { label: 'Reminder', icon: 'pi pi-bell', command: () => this.updateStatus('reminder') },
      { label: 'Escalate', icon: 'pi pi-exclamation-triangle', command: () => this.updateStatus('escalate') },
      { label: 'Archived', icon: 'pi pi-book', command: () => this.updateStatus('validated') },
      { label: 'Canceled', icon: 'pi pi-times-circle', command: () => this.updateStatus('canceled') },
    ];
  }

  updateStatus(newStatus: string): void {
    this.status = newStatus;
    this.currentView = 'loading';
    newStatus === 'validated' ? this.loadValidatedForms() : this.loadForms(newStatus);
  }

  checkAndLoadForms(): void {
    if (this.selectedApps.length > 0 && this.status) {
      this.loadForms(this.status);
    }
  }

  onAppOptionsLoaded(options: { name: string; token: string }[]): void {
    this.appOptions = options;
  }

  onSelectedAppIdsChange(selectedAppIds: string[]): void {
    this.selectedApps = selectedAppIds;
    this.checkAndLoadForms();
  }

  loadForms(status: string): void {
    this.loading = true;
    const appIds = this.selectedApps.join(',');
    this.formService.getFormContainersByStatus(appIds, status).subscribe(
      (data) => {
        this.forms = data;
        this.currentView = 'table';
        this.loading = false;
      },
      () => (this.loading = false)
    );
  }

  loadValidatedForms(): void {
    this.loading = true;
    const appIds = this.selectedApps.join(',');
    this.formService.getValidatedFormContainers(appIds).subscribe(
      (data) => {
        this.forms = data;
        this.currentView = 'table';
        this.loading = false;
      },
      () => (this.loading = false)
    );
  }


  loadFormDetails(accessToken: string): void {
    this.loading = true;
    this.formService.getFormContainerByAccessToken(accessToken).subscribe(
      (data) => {
        this.formContainer = data;
        this.currentView = 'questions';
        this.loading = false;
      },
      () => (this.loading = false)
    );
  }

  switchTo(view: string): void {
    this.currentView = view;
    if (view === 'table') {
      this.loadForms(this.status);
      this.location.go('/dashboard');
    } else if(view === 'createForm'){
      this.location.go('/create-form');
    } else {
      this.location.go('/dashboard');
    }
  }

  navigateToCreateForm(): void {
    this.switchTo('createForm');
  }

  onFormSelected(accessToken: string): void {
    this.loadFormDetails(accessToken);
  }
}
