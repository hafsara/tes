import { Component, OnInit } from '@angular/core';
import { FormService } from '../../services/form.service';
import { TokenService } from '../../services/token.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss'],
  providers: [MessageService]
})
export class AccessControlComponent implements OnInit {
  tokens: string[] = [];
  validTokens: string[] = [];
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
  const appIdToRemove = event.value;
  this.invalidTokens.delete(appIdToRemove);
  this.validTokens = this.validTokens.filter(token => {
      try {
        const decoded: { app_id: string } = jwtDecode(token);
          return decoded.app_id !== appIdToRemove;
      } catch (error) {
        console.error('Error decoding token:', error);
        return true;
      }
  });
  }

  validateToken(token: string): void {
    this.formService.validateToken(token).subscribe({
      next: (response) => {
        if (response.is_valid && response.token) {
          this.invalidTokens.delete(token);
          this.validTokens.push(response.token);
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
    } else if (this.validTokens.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'No Tokens', detail: 'Please add at least one valid token.' });
    } else {
      this.tokenService.storeTokens(this.validTokens, 60);
      this.tokenService.startSessionTimer(60);
      this.router.navigate(['/dashboard']);
    }
  }
}
