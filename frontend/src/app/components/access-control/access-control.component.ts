import { Component, OnInit } from '@angular/core';
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
export class AccessControlComponent implements OnInit{
  tokens: string[] = [];
  isTokenInvalid: boolean = false;
  invalidTokens: Set<string> = new Set();

  constructor(
    private formService: FormService,
    private tokenService: TokenService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.tokenService.hasValidTokens()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onTokenAdd(event: any): void {
    const newToken = event.value;
    this.validateToken(newToken);
  }

  onTokenRemove(event: any): void {
    const token = event.value;
    this.invalidTokens.delete(token);
    this.tokens = this.tokens.filter(t => t !== token);
    this.tokenService.storeTokens(this.tokens, 60);
  }

  validateToken(token: string): void {
    this.formService.validateToken(token).subscribe({
      next: (isValid) => {
        if (isValid) {
          this.invalidTokens.delete(token);
          this.tokenService.storeTokens(this.tokens, 60);
        } else {
          this.isTokenInvalid = true;
          this.invalidTokens.add(token);
          this.messageService.add({ severity: 'error', summary: 'Invalid Token', detail: `Token ${token} is invalid.` });
        }
      },
      error: () => {
        this.isTokenInvalid = true;
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
