import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = 'appTokens';
  private readonly expirationKey = 'tokenExpiration';
  private tokensSubject = new BehaviorSubject<string[]>(this.retrieveTokens());
  tokens$ = this.tokensSubject.asObservable();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.sessionStorage;
  }

  storeTokens(tokens: string[], durationInMinutes: number): void {
    if (this.isBrowser()) {
      sessionStorage.setItem(this.tokenKey, JSON.stringify(tokens));
      const expirationTime = new Date().getTime() + durationInMinutes * 60 * 1000;
      localStorage.setItem(this.expirationKey, expirationTime.toString());
    }
  }

  retrieveTokens(): string[] {
    if (this.isBrowser() && this.isSessionValid()) {
      return JSON.parse(sessionStorage.getItem(this.tokenKey) || '[]');
    }
    this.clearTokens();
    return [];
  }

  hasValidTokens(): boolean {
    return this.retrieveTokens().length > 0;
  }

  clearTokens(): void {
    if (this.isBrowser()) {
      sessionStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.expirationKey);
    }
  }

  private isSessionValid(): boolean {
    const expirationTime = localStorage.getItem(this.expirationKey);
    if (expirationTime) {
      const now = new Date().getTime();
      if (now < parseInt(expirationTime, 10)) {
        return true;
      }
    }
    return false;
  }
}
