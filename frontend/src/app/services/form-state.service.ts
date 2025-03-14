import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormService } from './form.service';
import { PollingService } from './polling.service';

@Injectable({ providedIn: 'root' })
export class FormStateService {
  public currentPage$ = new BehaviorSubject<number>(1);
  public pageSize$ = new BehaviorSubject<number>(10);
  public filters$ = new BehaviorSubject<any>({});
  public sortOrder$ = new BehaviorSubject<string>('desc');
  public selectedApps$ = new BehaviorSubject<string[]>([]);
  public currentStatus$ = new BehaviorSubject<string>('answered');
  public currentView$ = new BehaviorSubject<string>('table');

  public forms$ = new BehaviorSubject<any[]>([]);
  public totalCount$ = new BehaviorSubject<number>(0);

  constructor(
    private formService: FormService,
    private pollingService: PollingService
  ) {
    this.setupPolling();
  }

  private setupPolling(): void {
    this.pollingService.startPolling(
      'tablePolling',
      15000,
      () => this.fetchForms(),
      (newData: any) => this.updateForms(newData)
    );
  }

  private async fetchForms(): Promise<any> {
    return this.formService.getFormContainersByStatus(
      this.selectedApps$.getValue().join(','),
      this.currentStatus$.value,
      this.currentPage$.value,
      this.pageSize$.value,
      this.filters$.value,
      this.sortOrder$.value
    ).toPromise();
  }

  private updateForms(newData: any): void {
    if (newData) {
      this.forms$.next(newData.form_containers || []);
      this.totalCount$.next(newData.total || 0);
    }
  }

  startPolling(): void {
    this.setupPolling();
  }

  stopPolling(): void {
    this.pollingService.stopPolling('tablePolling');
  }

  public updateFilters(filters: any): void {
    this.filters$.next(filters);
    this.refreshData();
  }

  public updateSort(order: string): void {
    this.sortOrder$.next(order);
    this.refreshData();
  }

  public updatePagination(page: number, size: number): void {
    this.currentPage$.next(page);
    this.pageSize$.next(size);
    this.refreshData();
  }

  refreshData(): void {
    this.fetchForms().then(data => this.updateForms(data));
  }

  ngOnDestroy(): void {
    this.pollingService.stopPolling('tablePolling');
  }
}
