import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormService } from '../../services/form.service';
import { PollingService } from '../../services/polling.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})

export class DashboardComponent implements OnInit, OnDestroy {
  menuItems: any[] = [];
  forms: any[] = [];
  formContainer: any = {};
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];
  loading = false;
  currentView = 'loading';
  status = 'answered';
  accessToken = '';
  pollingInterval: any;
  selectedMenuItem: number = 0;

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private location: Location,
    private messageService: MessageService,
    private pollingService: PollingService
  ) {
    this.initializeMenuItems();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const accessToken = params.get('access_token');
      if (accessToken) {
        this.accessToken = accessToken;
        this.switchTo('questions');
      } else {
        this.currentView = 'table';
        this.checkAndLoadForms();
        this.startTablePolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  selectMenuItem(index: number): void {
    this.selectedMenuItem = index;
    this.menuItems[index].command();
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
    this.location.go('/dashboard');
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

  switchTo(view: string): void {
    this.currentView = view;
    if (view === 'table') {
      this.loadForms(this.status);
      this.location.go('/dashboard');
    } else if (view === 'createForm') {
      this.location.go('/dashboard');
    }
  }

  navigateToCreateForm(): void {
    this.switchTo('createForm');
  }

  onFormSelected(accessToken: string): void {
    this.accessToken = accessToken;
    this.switchTo('questions');
  }

  startTablePolling(): void {
    const appIds = this.selectedApps.join(',');

    this.pollingService.startPolling(
      'tablePolling',
      15000,
      () => this.fetchForms(appIds),
      (newData) => this.updateForms(newData)
    );
  }

  stopPolling(): void {
    this.pollingService.stopPolling('tablePolling');
  }

  private fetchForms(appIds: string): Promise<any[]> {
    return this.formService.getFormContainersByStatus(appIds, this.status).toPromise();
  }

  private updateForms(newData: any[]): void {
    if (newData.length !== this.forms.length) {
      this.forms = newData;
    }
  }
}
