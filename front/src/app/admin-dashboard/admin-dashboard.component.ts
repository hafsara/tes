import { Component, OnInit } from '@angular/core';
import { FormContainerService } from '../services/form-container.service';

interface FormContainer {
  id: number;
  title: string;
  userEmail: string;
  managerEmail: string;
  ticket: string;
  escalation: boolean;
  validated: boolean;
  forms: Form[];
}

interface Form {
  id: number;
  title: string;
  status: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  formContainers: FormContainer[] = [];

  constructor(private formContainerService: FormContainerService) {}

  ngOnInit(): void {
    this.loadFormContainers();
  }

  loadFormContainers() {
    this.formContainerService.getFormContainers().subscribe((containers: FormContainer[]) => {
      this.formContainers = containers;
    });
  }

  validateContainer(containerId: number) {
    this.formContainerService.validateContainer(containerId).subscribe(() => {
      this.loadFormContainers();
    });
  }

  addFormToContainer(containerId: number) {
    this.formContainerService.addFormToContainer(containerId).subscribe(() => {
      this.loadFormContainers();
    });
  }
}
