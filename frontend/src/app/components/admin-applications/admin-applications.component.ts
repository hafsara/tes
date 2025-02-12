import { Component, Input, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { TokenService } from '../../services/token.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';


@Component({
  selector: 'app-admin-applications',
  templateUrl: './admin-applications.component.html',
  styleUrl: './admin-applications.component.scss'
})
export class AdminApplicationsComponent {

  @Input() appOptions: { name: string; token: string }[] = [];
  applications: any[] = [];
  displayCreateAppDialog = false;
  displayUpdateAppDialog = false;
  generate_new_id = false;
  newAppName: string = '';
  newId: string = '';
  displayShowDialog = false
  selectedApplication: any = {};
  oldApp: any = {};
  editDialogVisible = false;

  ngOnInit(): void {
    this.loadApplications();
  }

  constructor(private adminService: AdminService, private tokenService: TokenService, private messageService: MessageService, private confirmationService: ConfirmationService) {}


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
    this.newAppName = "";
  }

  confirmCreateApp(): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to create <b>${this.newAppName}</b> application?`,
      header: 'Confirm creation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.createApplication();
      },
    });
  }

  createApplication() {
    if (!this.newAppName.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Application name cannot be empty' });
      return;
    }

    if (this.applications.some(app => app.name === this.newAppName)  ) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: `<b>${this.newAppName}</b> already exists`});
      return;
    }

    const newApp = {
      name: this.newAppName,
    };

    this.adminService.createApplication(newApp).subscribe(
      (response) => {
        this.newId = response.app_id;
        this.displayShowDialog = true;
        this.displayCreateAppDialog = false;
        this.newAppName = '';
        this.loadApplications();
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to create application ${error}` });
      }
    );
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

  openEditDialog(application: any) {
    this.selectedApplication = { ...application };
    this.oldApp = { ...application };
    this.editDialogVisible = true;
  }

  confirmEditApplication(appData: any, rotateToken: boolean): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to edit this application?',
      header: 'Confirm update',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.updateApplication(appData, rotateToken);
        this.loadApplications();
      },
    });
  }

  updateApplication(appData: any, rotateToken: boolean) {
    const oldName = this.oldApp.name;
    if (
      this.applications.some(
        (app) => app.name.toLowerCase() === appData.name.toLowerCase() && app.id !== appData.id
      )
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Application name already exists',
      });
      return;
    }

    if (!this.isValidEmail(appData.mail_sender)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid email format',
      });
      return;
    }

    const updatedData = {
      name: appData.name,
      generate_new_id: rotateToken,
      new_mail_sender: appData.mail_sender,
    };

    this.adminService.updateApplication(appData.id, updatedData).subscribe(
      (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Application updated successfully',
        });

        this.tokenService.updateStoredToken(
          oldName,
          updatedData.name,
          rotateToken ? response.app_token : undefined
        );

        this.editDialogVisible = false;
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update application',
        });
      }
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  updateLocalStorage(oldApp: any, updatedData: any) {
    // mettre à jour le localstorage
  }
}
