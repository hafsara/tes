import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormService } from '../../services/form.service';
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

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private location: Location,
    private messageService: MessageService
  ) {
    this.initializeMenuItems();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const accessToken = params.get('access_token');
      if (accessToken) {
        this.loadFormDetails(accessToken);
        this.startFormPolling();
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
    this.accessToken = accessToken;
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

  startTablePolling(): void {
    this.pollingInterval = setInterval(() => {
      const appIds = this.selectedApps.join(',');
      this.formService.getFormContainersByStatus(appIds, this.status).subscribe((newData: any[]) => {
        if (JSON.stringify(newData) !== JSON.stringify(this.forms)) {
          this.forms = newData;
        }
      });
    }, 15000);
  }

  startFormPolling(): void {
    if (!this.formContainer || !this.accessToken){
      return;
    }
    if (
    this.formContainer.validated ||
    (Array.isArray(this.formContainer.forms) && this.formContainer.forms.some((form: any) => form.status === 'canceled'))
    ) {
      return;
    }

    let toastDisplayed = false;

    this.pollingInterval = setInterval(() => {
      this.formService.getFormContainerByAccessToken(this.accessToken).subscribe((newData: any) => {
        const hasFormContainerChanged =
          newData.validated !== this.formContainer.validated ||
          newData.forms.length !== this.formContainer.forms.length ||
          newData.forms.some((newForm: any) => {
            const existingForm = this.formContainer.forms.find((form: any) => form.form_id === newForm.form_id);
            return existingForm && newForm.status !== existingForm.status;
          });
        if (hasFormContainerChanged && !toastDisplayed) {
          toastDisplayed = true;
          this.messageService.add({
              severity: 'warn',
              summary: 'Form Updated',
              detail: 'The form has been updated. Click here to refresh.',
              sticky: true,
              key: 'br',
          });
          this.stopPolling();
        }
      });
    }, 15000);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  handleRefresh(): void {
    this.messageService.clear();
    this.refreshFormContainer();
  }

  refreshFormContainer(): void {
    this.loadFormDetails(this.accessToken);
    this.startFormPolling();
  }
}
