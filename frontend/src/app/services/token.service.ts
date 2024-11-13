import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = 'appTokens';

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.sessionStorage;
  }

  storeTokens(tokens: string[]): void {
    if (this.isBrowser()) {
      sessionStorage.setItem(this.tokenKey, JSON.stringify(tokens));
    }
  }

  retrieveTokens(): string[] {
    if (this.isBrowser()) {
      const tokens = sessionStorage.getItem(this.tokenKey);
      return tokens ? JSON.parse(tokens) : [];
    }
    return [];
  }

  hasValidTokens(): boolean {
    const tokens = this.retrieveTokens();
    return tokens.length > 0;
  }

  clearTokens(): void {
    if (this.isBrowser()) {
      sessionStorage.removeItem(this.tokenKey);
    }
  }
}
