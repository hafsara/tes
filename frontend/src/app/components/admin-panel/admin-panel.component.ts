import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  providers: [MessageService]
})

export class AdminPanelComponent {
  appOptions: { name: string; token: string }[] = [];
  apiTokens: any[] = [];
  applications: any[] = [];
  campaigns: any[] = [];

  selectedTab: string = 'api-tokens';
  showNewTokenForm: boolean = false;

  createTokenForm: FormGroup;
  createAppForm: FormGroup;
  createCampaignForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.createTokenForm = this.fb.group({
      name: ['', Validators.required],
      application: ['', Validators.required],
      expiration: [30, [Validators.required, Validators.min(1)]],
    });

    this.createAppForm = this.fb.group({
      name: ['', Validators.required]
    });

    this.createCampaignForm = this.fb.group({
      name: ['', Validators.required],
      applicationId: ['', Validators.required]
    });
  }

  createApplication(): void {
    if (this.createAppForm.valid) {
      this.http.post('/applications', this.createAppForm.value).subscribe(
        (response: any) => {
          this.applications.push(response);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Application created successfully' });
          this.createAppForm.reset();
        },
        (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create application' })
      );
    }
  }

  onAppOptionsLoaded(options: { name: string; token: string }[]): void {
    this.appOptions = options;
  }
}
