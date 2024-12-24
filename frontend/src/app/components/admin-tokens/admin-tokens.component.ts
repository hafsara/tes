import { Component, Input, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-tokens',
  templateUrl: './admin-tokens.component.html',
  styleUrls: ['./admin-tokens.component.scss'],
})

export class AdminTokensComponent implements OnInit {
  @Input() appOptions: { name: string; token: string }[] = [];
  tokens: any[] = [];
  displayCreateTokenDialog = false;

  newToken = {
    token_name: '',
    app_names: [],
    expiration: 30
  };

  ngOnInit(): void {
    console.log('Received appOptions:', this.appOptions);
    this.loadTokens();
  }

  constructor(private adminService: AdminService, private messageService: MessageService) {}


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
    this.newToken = { token_name: '', app_names: [], expiration: 30 };
  }

  createToken(): void {
    if (!this.newToken.token_name || this.newToken.app_names.length === 0 || this.newToken.expiration <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all fields.' });
      return;
    }

    const tokenData = {
      token_name: this.newToken.token_name,
      app_names: this.newToken.app_names.map((app: any) => app.name),
      expiration: this.newToken.expiration,
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
  copyToClipboard(token: string): void {
      navigator.clipboard.writeText(token).then(
        () => {
                this.messageService.add({ severity: 'contrast', detail: 'Token copied to clipboard!', life: 1000, key: "br"});
        },
        (err) => {
            this.messageService.add({ severity: 'error', detail: 'Failed to copy token. Please try again.', life: 1000, key: "br"});
        }
      );
  }
}
