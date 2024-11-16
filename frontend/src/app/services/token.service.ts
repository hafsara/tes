import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = 'appTokens';
  private readonly localStorageKey = 'selectedApps';
  private tokenSubject = new BehaviorSubject<string[]>(this.retrieveTokens());
  tokenUpdates = this.tokenSubject.asObservable();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  storeTokens(tokens: string[], expirationMinutes: number = 60): void {
    if (!this.isBrowser()) return;

    const expirationDate = Date.now() + expirationMinutes * 60 * 1000;
    const data = { tokens, expirationDate };
    localStorage.setItem(this.tokenKey, JSON.stringify(data));
    this.tokenSubject.next(tokens);
  }

  retrieveTokens(): string[] {
    if (!this.isBrowser()) return [];

    const storedData = localStorage.getItem(this.tokenKey);
    if (!storedData) return [];

    const { tokens, expirationDate } = JSON.parse(storedData);
    if (Date.now() > expirationDate) {
      this.clearTokens();
      return [];
    }
    return tokens;
  }

  private decodeToken(token: string): any | null {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  getAppNames(): { name: string | null; token: string }[] {
    return this.retrieveTokens().map(token => {
      const decoded = this.decodeToken(token);
      return { name: decoded?.application_name || 'Unknown', token };
    });
  }

  hasValidTokens(): boolean {
    return this.retrieveTokens().length > 0;
  }

  clearTokens(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem(this.tokenKey);
    this.tokenSubject.next([]);
  }

  startSessionTimer(durationInMinutes: number): void {
    setTimeout(() => {
      this.clearTokens();
      localStorage.removeItem(this.localStorageKey);
      window.location.href = '/access-control';
      location.reload();
    }, durationInMinutes * 60 * 1000);
  }

  logout(): void {
    this.clearTokens();
    window.location.href = '/access-control';
  }

  getConnectedAppNamesFromToken(): string[] {
    return this.retrieveTokens()
      .map(token => this.decodeToken(token)?.connectedApps || [])
      .flat();
  }
}
