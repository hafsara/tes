import { Component } from '@angular/core';
import { FormService } from '../../services/form.service';
import { TokenService } from '../../services/token.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss'],
  providers: [MessageService]
})
export class AccessControlComponent {
  tokens: string[] = [];
  invalidTokens: Set<string> = new Set();

  constructor(
    private formService: FormService,
    private tokenService: TokenService,
    private messageService: MessageService,
    private router: Router
  ) {}

  onTokenAdd(event: any): void {
    const newToken = event.value;
    this.validateToken(newToken);
  }

  onTokenRemove(event: any): void {
    const token = event.value;
    this.invalidTokens.delete(token);
    this.tokens = this.tokens.filter(t => t !== token);
    this.tokenService.storeTokens(this.tokens);
  }

  validateToken(token: string): void {
    this.formService.validateToken(token).subscribe({
      next: (isValid) => {
        if (isValid) {
          this.invalidTokens.delete(token);
          this.tokens.push(token);
          this.tokenService.storeTokens(this.tokens);
        } else {
          this.invalidTokens.add(token);
          this.messageService.add({ severity: 'error', summary: 'Invalid Token', detail: `Token ${token} is invalid.` });
        }
      },
      error: () => {
        this.invalidTokens.add(token);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to validate token ${token}.` });
      }
    });
  }

  submitTokens(): void {
    if (this.invalidTokens.size > 0) {
      this.messageService.add({ severity: 'error', summary: 'Invalid Tokens', detail: 'Please correct the invalid tokens.' });
    } else if (this.tokens.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'No Tokens', detail: 'Please add at least one valid token.' });
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}