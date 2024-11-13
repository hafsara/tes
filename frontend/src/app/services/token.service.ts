// token.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private storageKey = 'appTokens';

  storeTokens(tokens: string[]): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(tokens));
  }

  retrieveTokens(): string[] {
    const tokens = sessionStorage.getItem(this.storageKey);
    return tokens ? JSON.parse(tokens) : [];
  }

  clearTokens(): void {
    sessionStorage.removeItem(this.storageKey);
  }

  hasValidTokens(): boolean {
    return this.retrieveTokens().length > 0;
  }
}
