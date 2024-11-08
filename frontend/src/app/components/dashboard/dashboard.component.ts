import { Component, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { FormService } from '../../services/form.service';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormContainer } from '../../utils/question-formatter';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  menuItems: any[];
  forms: any[] = [];
  formContainer: any = {};
  searchValue: string | undefined;
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
        this.loadForms();
      }
    });
  }


  onMenuItemClick(status: string) {
    this.status = status;
    this.location.go('/dashboard');
    this.loadForms();
    this.currentView = 'table';
  }

  loadForms() {
    this.loading = true;
    this.formService.getFormContainersByStatus(this.status).subscribe(
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
        this.formContainer = data;
        this.formContainer.access_token = access_token;
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
      this.loadForms()
    }
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }
}
