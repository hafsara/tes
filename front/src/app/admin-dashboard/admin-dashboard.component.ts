import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormContainerService } from '../services/form-container.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  formContainers = [];
  selectedForm: any;

  constructor(
    private router: Router,
    private formContainerService: FormContainerService
  ) {}

  ngOnInit(): void {
    this.loadFormContainers();
  }

  loadFormContainers(): void {
    this.formContainerService.getFormContainers().subscribe((data) => {
      this.formContainers = data;
    });
  }

  navigateToCreateForm(): void {
    this.router.navigate(['/create-form']);
  }

  refreshFormList(): void {
    this.loadFormContainers();
  }

  selectForm(form: any): void {
    this.selectedForm = form;
  }
}
