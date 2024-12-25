import { Component, Input, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-admin-applications',
  templateUrl: './admin-applications.component.html',
  styleUrl: './admin-applications.component.scss'
})
export class AdminApplicationsComponent {

  @Input() appOptions: { name: string; token: string }[] = [];
  applications: any[] = [];
  displayCreateAppDialog = false;

  newToken = {
    token_name: '',
    app_names: [],
    expiration: 30
  };

  newTokenJwt: string | null = null;

  displayTokenDialog: boolean = false;

  ngOnInit(): void {
    this.loadApplications();
  }

  constructor(private adminService: AdminService, private messageService: MessageService, private confirmationService: ConfirmationService) {}


  loadApplications(): void {
    this.adminService.getApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
      },
      error: (err) => {
        console.error('Failed to load applications:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load applications.' });
      },
    });
  }

  showCreateTokenDialog(): void {
    this.displayCreateAppDialog = true;
  }

  hideCreateTokenDialog(): void {
    this.displayCreateAppDialog = false;
    this.newToken = { token_name: '', app_names: [], expiration: 30 };
  }

  createToken(): void {
  }

  copyToClipboard(id: string): void {
      navigator.clipboard.writeText(id).then(
        () => {
            this.messageService.add({ severity: 'contrast', detail: 'Application ID copied to clipboard!', life: 1000, key: "br"});
        },
        (err) => {
            this.messageService.add({ severity: 'error', detail: 'Failed to copy application ID. Please try again.', life: 1000, key: "br"});
        }
      );
  }

  confirmEditToken(oldToken: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to edit this application?',
      header: 'Confirm update',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log('');
      },
    });
  }
}

