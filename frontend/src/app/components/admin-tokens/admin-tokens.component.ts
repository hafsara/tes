import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-tokens',
  templateUrl: './admin-tokens.component.html',
  styleUrls: ['./admin-tokens.component.scss'],
  providers: [MessageService],
})
export class AdminTokensComponent implements OnInit {
  applications: any[] = [];
  tokens: any[] = [];
  tokenForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.tokenForm = this.fb.group({
      tokenName: ['', Validators.required],
      application: ['', Validators.required],
      expirationDays: [30, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.loadApplications();
    this.loadTokens();
  }

  loadApplications(): void {
    this.adminService.getApplications().subscribe({
      next: (apps) => {
        this.applications = apps.map((app: any) => ({
          label: app.name,
          value: app.id,
        }));
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load applications',
        });
        console.error(err);
      },
    });
  }

  loadTokens(): void {
    this.adminService.getTokens().subscribe({
      next: (tokens) => {
        this.tokens = tokens;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tokens',
        });
        console.error(err);
      },
    });
  }

  createToken(): void {
    if (this.tokenForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Input',
        detail: 'Please fill all required fields',
      });
      return;
    }

    const formData = this.tokenForm.value;
    this.adminService.createToken(formData).subscribe({
      next: (response) => {
        this.tokens.push(response);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Token created successfully',
        });
        this.tokenForm.reset();
        this.tokenForm.get('expirationDays')?.setValue(30);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create token',
        });
        console.error(err);
      },
    });
  }
}
