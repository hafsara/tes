import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormStateService } from '../../services/form-state.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentView: 'loading' | 'table' | 'questions' | 'createForm' = 'loading';
  isFilterVisible = false;
  accessToken: string | null = null;
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    public state: FormStateService
  ) {}

  ngOnInit(): void {
    this.initRouteListening();
    this.state.selectedApps$.subscribe(apps => {
      this.selectedApps = apps;
    });
  }

  private initRouteListening(): void {
    this.route.paramMap.subscribe(params => {
      const token = params.get('access_token');
      token ? this.showQuestionsView(token) : this.showTableView();
    });
  }

  public showTableView(): void {
    this.currentView = 'table';
    this.state.currentView$.next('table');
    this.state.startPolling();
    this.location.go('/dashboard');
  }

  private showQuestionsView(token: string): void {
    this.currentView = 'questions';
    this.state.currentView$.next('questions');
    this.state.stopPolling();
    this.accessToken = token;
  }

  navigateToCreateForm(): void {
    this.currentView = 'createForm';
    this.state.currentView$.next('createForm');
    this.state.stopPolling();
    this.location.go('/create-form');
  }

  ngOnDestroy(): void {
    this.state.ngOnDestroy();
  }

  handleStatusChange(status: string): void {
    this.state.currentStatus$.next(status);
    this.state.refreshData();
  }

  handleAppSelection(selectedApps: string[]): void {
    this.selectedApps = selectedApps;
    this.state.updatePagination(1, this.state.pageSize$.value);
  }

  onSelectedAppIdsChange(selectedAppIds: string[]): void {
    this.state.selectedApps$.next(selectedAppIds);
    this.state.updatePagination(1, this.state.pageSize$.value);
  }

  onFormSelected(accessToken: string): void {
    this.showQuestionsView(accessToken);
  }
}
