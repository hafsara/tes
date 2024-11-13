import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = 'appTokens';
  private tokensSubject = new BehaviorSubject<string[]>(this.retrieveTokens());
  tokens$ = this.tokensSubject.asObservable();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.sessionStorage;
  }

  storeTokens(tokens: string[]): void {
    if (this.isBrowser()) {
      sessionStorage.setItem(this.tokenKey, JSON.stringify(tokens));
      this.tokensSubject.next(tokens);
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
      this.tokensSubject.next([]);
    }
  }

  startSessionTimer(durationInMinutes: number) {
    setTimeout(() => {
      this.clearTokens();
      window.location.href = '/access-control';
    }, durationInMinutes * 60 * 1000);
  }
}
