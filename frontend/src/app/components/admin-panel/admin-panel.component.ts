import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  providers: [MessageService]
})
export class AdminPanelComponent implements OnInit {
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

  ngOnInit(): void {
    //this.loadApiTokens();
    //this.loadApplications();
    //this.loadCampaigns();
  }

  // Load API Tokens
  loadApiTokens(): void {
    this.http.get('/api/tokens').subscribe(
      (data: any) => (this.apiTokens = data),
      (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load API tokens' })
    );
  }

  // Load Applications
  loadApplications(): void {
    this.http.get('/applications').subscribe(
      (data: any) => (this.applications = data),
      (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load applications' })
    );
  }

  // Load Campaigns
  loadCampaigns(): void {
    this.http.get('/campaigns').subscribe(
      (data: any) => (this.campaigns = data),
      (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load campaigns' })
    );
  }

  // Create API Token
  createToken(): void {
    if (this.createTokenForm.valid) {
      this.http.post('/api-tokens', this.createTokenForm.value).subscribe(
        (response: any) => {
          this.apiTokens.push(response);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Token created successfully' });
          this.showNewTokenForm = false;
          this.createTokenForm.reset();
        },
        (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create token' })
      );
    }
  }

  // Create Application
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

  createCampaign(): void {
    if (this.createCampaignForm.valid) {
      this.http.post('/campaigns', this.createCampaignForm.value).subscribe(
        (response: any) => {
          this.campaigns.push(response);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Campaign created successfully' });
          this.createCampaignForm.reset();
        },
        (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create campaign' })
      );
    }
  }
}
