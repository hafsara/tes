import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormService } from '../../services/form.service';
import { PollingService } from '../../services/polling.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})

export class DashboardComponent implements OnInit, OnDestroy {
  forms: any[] = [];
  totalCount: number = 0;
  currentFormContainerCount: number = 0;
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];
  currentView = 'loading';
  status = 'answered';
  accessToken: string | null = null;
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50];
  currentFilters: any = {};

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private location: Location,
    private pollingService: PollingService
  ) {}

  ngOnInit(): void {
    // todo recuperer les filtre stocker
    this.route.paramMap.subscribe(params => {
      const accessToken = params.get('access_token');
      if (accessToken) {
        this.onFormSelected(accessToken);
      } else {
        this.switchTo('table')
        this.startTablePolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  selectMenuItem(status: string): void {
    this.updateStatus(status);
  }

  updateStatus(newStatus: string): void {
    this.status = newStatus;
    this.currentView = 'loading';
    this.switchTo('table');
    this.location.go('/dashboard');
  }

  handleFilterChange(tags: string[]): void {
    this.currentFilters = {
      appNames: tags.filter(t => t.startsWith('app: ')).map(t => t.replace('app: ', '')),
      references: tags.filter(t => t.startsWith('ref: ')).map(t => t.replace('ref: ', '')),
      expired: tags.includes('EXPIRED')
    };
    this.checkAndLoadForms();

    // todo stocker les filtre
  }

  checkAndLoadForms(): void {
    if (this.selectedApps.length > 0 && this.status) {
      const appIds = this.selectedApps.join(',');
      this.loadForms(appIds, this.status);
    } else {
      this.forms = [];
      this.totalCount = 0;
    }
  }

  onAppOptionsLoaded(options: { name: string; token: string }[]): void {
    this.appOptions = options;
  }

  onSelectedAppIdsChange(selectedAppIds: string[]): void {
    this.selectedApps = selectedAppIds;
    this.currentPage = 1;
    this.checkAndLoadForms();
  }

  loadForms(appIds: string, status: string): void {
    this.fetchTotalCount(appIds);
    this.formService.getFormContainersByStatus(
      appIds,
      status,
      this.currentPage,
      this.pageSize,
      this.currentFilters
    ).subscribe((data) => {
      this.forms = data.form_containers;
      this.currentFormContainerCount = data.total;
    });
  }

  handlePageChange(paginationParams: { page: number; limit: number }): void {
    this.currentPage = paginationParams.page;
    this.pageSize = paginationParams.limit;
    this.checkAndLoadForms();
  }

  switchTo(view: string): void {
    this.currentView = view;
    if (view === 'table') {
      this.checkAndLoadForms();
      this.location.go('/dashboard');
      this.currentPage = 1;
    } else if (view === 'createForm') {
      this.location.go('/create-form');
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
    this.pollingService.startPolling(
      'tablePolling',
      15000,
      () => this.fetchFormsWithParams(),
      (newData) => this.updateForms(newData)
    );
  }

  private fetchFormsWithParams(): Promise<{ total: number; form_containers: any[] }> {
    const appIds = this.selectedApps.join(',');
    return this.formService.getFormContainersByStatus(
      appIds,
      this.status,
      this.currentPage,
      this.pageSize,
      this.currentFilters
    ).toPromise();
  }

  stopPolling(): void {
    this.pollingService.stopPolling('tablePolling');
  }

  private fetchForms(appIds: string): Promise<{ total: number; form_containers: any[] }> {
    return this.formService.getFormContainersByStatus(appIds, this.status, this.currentPage, this.pageSize)
      .toPromise()
      .then(response => ({
        total: response.total,
        form_containers: response.form_containers || []
      }))
      .catch(() => ({ total: 0, form_containers: [] }));
  }

  private updateForms(newData: { total: number; form_containers: any[] }): void {
    if (newData.form_containers.length !== this.forms.length) {
      this.forms = newData.form_containers;
    }
  }

  fetchTotalCount(appIds: string): void {
    this.formService.getTotalFormsCount(appIds).subscribe({
      next: (response) => {
        this.totalCount = response.totalCount;
      }
    });
  }
}
