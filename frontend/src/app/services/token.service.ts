import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = 'appTokens';
  private readonly localStorageKey = 'selectedApps';
  private tokenSubject = new BehaviorSubject<string[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public tokenUpdates = this.tokenSubject.asObservable();
  public loadingStatus = this.loadingSubject.asObservable();

  constructor() {
    this.initializeTokens();
  }

  private initializeTokens(): void {
    this.loadingSubject.next(true);
    const tokens = this.safeRetrieveTokens();
    this.tokenSubject.next(tokens);
    this.loadingSubject.next(false);
  }

  private safeLocalStorageGet(key: string): string | null {
    return this.isBrowser() ? localStorage.getItem(key) : null;
  }

  private safeLocalStorageSet(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    }
  }

  private safeLocalStorageRemove(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    }
  }

  storeTokens(tokens: string[], expirationMinutes: number = 60): void {
    const expirationDate = Date.now() + expirationMinutes * 60 * 1000;
    const data = { tokens, expirationDate };
    this.safeLocalStorageSet(this.tokenKey, JSON.stringify(data));
    this.tokenSubject.next(tokens);
  }

  private safeRetrieveTokens(): string[] {
    const storedData = this.safeLocalStorageGet(this.tokenKey);
    if (!storedData) return [];

    try {
      const parsedData = JSON.parse(storedData);
      const { tokens, expirationDate } = parsedData;

      if (expirationDate && Date.now() > expirationDate) {
        this.clearTokens();
        return [];
      }

      return tokens || [];
    } catch (error) {
      console.error('Error parsing tokens from localStorage:', error);
      this.clearTokens();
      return [];
    }
  }

  clearTokens(): void {
    this.safeLocalStorageRemove(this.tokenKey);
    this.tokenSubject.next([]);
  }

  decodeToken(token: string): any | null {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  getAppNames(): { name: string | null; token: string }[] {
    return this.safeRetrieveTokens().map((token) => {
      const decoded = this.decodeToken(token);
      return { name: decoded?.application_name || 'Unknown', token };
    });
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  hasValidTokens(): boolean {
    return this.tokenSubject.getValue().length > 0;
  }

  logout(): void {
    this.clearTokens();
    window.location.href = '/access-control';
  }

  startSessionTimer(durationInMinutes: number): void {
    setTimeout(() => {
      this.clearTokens();
      localStorage.removeItem(this.localStorageKey);
      window.location.href = '/access-control';
      location.reload();
    }, durationInMinutes * 60 * 1000);
  }
  }
