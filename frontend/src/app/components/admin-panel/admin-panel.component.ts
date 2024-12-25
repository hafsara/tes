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

  onAppOptionsLoaded(options: { name: string; token: string }[]): void {
    this.appOptions = options;
  }
}
