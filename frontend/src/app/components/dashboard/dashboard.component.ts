import { Component, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { FormService } from '../../services/form.service';
import { formatQuestions } from '../../utils/question-formatter';
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
  selectedForm: any = null;
  questions: any[] = [];
  currentView: string = 'table';
  loading: boolean = false;
  searchValue: string | undefined;

  constructor(private route: ActivatedRoute, private formService: FormService, private location: Location) {
    this.menuItems = [
      { label: 'To be checked', icon: 'pi pi-verified', command: () => this.onMenuItemClick('answered') },
      { label: 'In progress', icon: 'pi pi-star', command: () => this.onMenuItemClick('open') },
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
        this.loadForms('answered');
      }
    });
  }


  onMenuItemClick(status: string) {
    console.log(`${status} selected`);
    this.loadForms(status);
    this.currentView = 'table';
  }

  loadForms(status: string) {
    this.loading = true;
    this.formService.getFormContainersByStatus(status).subscribe(
      (data) => {
        this.forms = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors de la récupération des données', error);
        this.loading = false;
      }
    );
  }

  loadFormDetails(access_token: string) {
    this.formService.getFormContainerByAccessToken(access_token).subscribe(
      (data) => {
        this.currentView = 'questions';
        this.questions = data.forms[0].questions;
        this.selectedForm = data;
        this.currentView = 'questions';
      },
      (error) => {
        console.error('Error loading form details:', error);
      }
    );
  }

  switchTo(view: string) {
    this.currentView = view;
    this.location.go('/dashboard');
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }
}
