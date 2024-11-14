import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = 'appTokensNew';
  private tokenSubject = new BehaviorSubject<string[]>(this.retrieveTokens());
  tokenUpdates = this.tokenSubject.asObservable();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  storeTokens(tokens: string[], expirationMinutes: number = 60): void {
    if (this.isBrowser()) {
      const expirationDate = new Date().getTime() + expirationMinutes * 60 * 1000;
      const data = { tokens, expirationDate };
      localStorage.setItem(this.tokenKey, JSON.stringify(data));
      this.tokenSubject.next(tokens);
    }
  }

  retrieveTokens(): string[] {
    if (this.isBrowser()) {
      const storedData = localStorage.getItem(this.tokenKey);
      if (storedData) {
        const { tokens, expirationDate } = JSON.parse(storedData);
        if (new Date().getTime() > expirationDate) {
          this.clearTokens();
          return [];
        }
        return tokens;
      }
    }
    return [];
  }

  getAppNames(): (string | null)[] {
    const tokens = this.retrieveTokens();
    const appNames: (string | null)[] = [];

    tokens.forEach(token => {
      try {
        const decoded: { application_name: string } = jwtDecode(token);
        appNames.push(decoded.application_name);
      } catch (error) {
        appNames.push(null);
      }
    });

    return appNames;
  }

  hasValidTokens(): boolean {
    const tokens = this.retrieveTokens();
    return tokens.length > 0 ;
  }

  clearTokens(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.tokenKey);
      this.tokenSubject.next([]);
    }
  }

  startSessionTimer(durationInMinutes: number) {
    setTimeout(() => {
      this.clearTokens();
      window.location.href = '/access-control';
    }, durationInMinutes * 60 * 1000);
  }

  logout(): void {
    this.clearTokens();
    window.location.href = '/access-control';
  }
}
