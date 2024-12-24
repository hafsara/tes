import { Component, Input, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { MessageService, ConfirmationService } from 'primeng/api';

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

  newTokenJwt: string | null = null;
  displayTokenDialog: boolean = false;

  ngOnInit(): void {
    this.loadTokens();
  }

  constructor(private adminService: AdminService, private messageService: MessageService, private confirmationService: ConfirmationService) {}


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
      app_names: this.newToken.app_names,
      expiration: this.newToken.expiration,
    };

    this.adminService.generateToken(tokenData).subscribe({
      next: (response) => {
        this.tokens.push(response);
        this.hideCreateTokenDialog();
        setTimeout(() => window.location.reload(), 1000);
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

  confirmRotateToken(oldToken: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to rotate this token?',
      header: 'Confirm Rotation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.rotateToken(oldToken);
      },
    });
  }

  confirmRevokeToken(token: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to revoke this token?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.revokeToken(token);
        setTimeout(() => window.location.reload(), 1000);
      }
    });
 }

 rotateToken(oldToken: string): void {
   this.adminService.rotateToken(oldToken).subscribe({
        next: (response) => {
          this.newTokenJwt = response.newToken;
          this.displayTokenDialog = true;

          const tokenIndex = this.tokens.findIndex((token) => token.token === oldToken);
          if (tokenIndex !== -1) {
            this.tokens[tokenIndex] = {
              ...this.tokens[tokenIndex],
              token: response.newToken
            };
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to rotate the token.' });
        },
   });
 }
}
