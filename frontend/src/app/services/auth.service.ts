import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'sso_token';

  constructor(private http: HttpClient) {}

  async fetchSSOInfo(): Promise<any> {
    const response = await this.http.get('/auth/login').toPromise();
    return response;
  }

  storeToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      console.warn('localStorage non disponible dans cet environnement.');
    }
  }

  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.tokenKey) : null;
  }

  clearToken(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
