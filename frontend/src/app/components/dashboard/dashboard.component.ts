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
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];
  currentView = 'loading';
  status = 'answered';
  accessToken: string | null = null;
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
        this.onFormSelected(accessToken);
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
    newStatus === 'validated' ? this.loadValidatedForms() : this.checkAndLoadForms();
    this.location.go('/dashboard');
  }

  checkAndLoadForms(): void {
    if (this.selectedApps.length > 0 && this.status) {
      const appIds = this.selectedApps.join(',');
      this.loadForms(appIds, this.status);
    } else {
      this.forms = []
    }
  }

  onAppOptionsLoaded(options: { name: string; token: string }[]): void {
    this.appOptions = options;
  }

  onSelectedAppIdsChange(selectedAppIds: string[]): void {
    this.selectedApps = selectedAppIds;
    this.checkAndLoadForms();
  }

  loadForms(appIds:string, status: string): void {
    this.formService.getFormContainersByStatus(appIds, status).subscribe(
      (data) => {
        this.forms = data;
        this.currentView = 'table';
      }
    );
  }

  loadValidatedForms(): void {
    const appIds = this.selectedApps.join(',');
    this.formService.getValidatedFormContainers(appIds).subscribe(
      (data) => {
        this.forms = data;
        this.currentView = 'table';
      }
    );
  }

  switchTo(view: string): void {
    this.currentView = view;
    if (view === 'table' || view === 'createForm') {
      this.checkAndLoadForms();
      this.location.go('/dashboard');
      this.accessToken = null;
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
      () => {
      const appIds = this.selectedApps.join(',');
      if (!appIds) {
        return Promise.resolve([]);
      }
      return this.fetchForms(appIds);
    },
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
