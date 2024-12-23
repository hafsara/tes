import { Component, Input, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-tokens',
  templateUrl: './admin-tokens.component.html',
  styleUrls: ['./admin-tokens.component.scss'],
  providers: [MessageService],
})
export class AdminTokensComponent implements OnInit {
  @Input() appOptions: { name: string; token: string }[] = [];
  tokens: any[] = [];
  displayCreateTokenDialog = false;

  newToken = {
    token_name: '',
    app_names: [],
  };

  constructor(private adminService: AdminService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadTokens();
  }

  loadTokens(): void {
    this.adminService.getTokens().subscribe({
      next: (tokens) => {
        this.tokens = tokens;
      },
      error: (err) => {
        console.error('Failed to load tokens:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tokens.' });
      },
    });
  }

  showCreateTokenDialog(): void {
    this.displayCreateTokenDialog = true;
  }

  hideCreateTokenDialog(): void {
    this.displayCreateTokenDialog = false;
    this.newToken = { token_name: '', app_names: [] };
  }

  createToken(): void {
    if (!this.newToken.token_name || this.newToken.app_names.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all fields.' });
      return;
    }

    const tokenData = {
      expiration: 60,
      token_name: this.newToken.token_name,
      app_names: this.newToken.app_names.map((app: any) => app.name),
    };

    this.adminService.generateToken(tokenData).subscribe({
      next: (response) => {
        this.tokens.push(response);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Token created successfully.' });
        this.hideCreateTokenDialog();
      },
      error: (err) => {
        console.error('Failed to create token:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create token.' });
      },
    });
  }

  revokeToken(token: string): void {
    this.adminService.revokeToken(token).subscribe({
      next: () => {
        this.tokens = this.tokens.filter((t) => t.token !== token);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Token revoked successfully.' });
      },
      error: (err) => {
        console.error('Failed to revoke token:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to revoke token.' });
      },
    });
  }
}
