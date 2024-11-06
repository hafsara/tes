import { Component, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { FormService } from '../../services/form.service';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  menuItems: any[];
  forms: any[] = [];
  questions: any[] = [];
  searchValue: string | undefined;
  selectedForm: any;
  currentView: string = 'loading';
  loading: boolean = true;
  status: string = 'answered';

  constructor(private route: ActivatedRoute, private formService: FormService, private location: Location) {
    this.menuItems = [
      { label: 'To be checked', icon: 'pi pi-verified', command: () => this.onMenuItemClick('answered') },
      { label: 'Open', icon: 'pi pi-star', command: () => this.onMenuItemClick('open') },
      { label: 'Reminder', icon: 'pi pi-refresh', command: () => this.onMenuItemClick('reminder') },
      { label: 'Escalate', icon: 'pi pi-flag', command: () => this.onMenuItemClick('escalate') },
    ];
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const accessToken = params.get('access_token');
      if (accessToken) {
        this.loadFormDetails(accessToken);
      } else {
        this.loadForms(this.status);
      }
    });
  }


  onMenuItemClick(status: string) {
    this.location.go('/dashboard');
    this.loadForms(status);
    this.currentView = 'table';
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

  loadFormDetails(access_token: string) {
    this.loading = true;
    this.formService.getFormContainerByAccessToken(access_token).subscribe(
      (data) => {
        this.questions = data.forms[0].questions;
        this.selectedForm = data;
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
    if (this.currentView == 'table'){
      this.loadForms(this.status)
    }
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }
}
