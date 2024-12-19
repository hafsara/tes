import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'sso_token';
  private authUrl = `${environment.apiUrl}/auth/login`;
  constructor(private http: HttpClient) {}

  fetchSSOInfo(): Observable<any> {
    return this.http.get(this.authUrl);
  }

  storeToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(this.tokenKey, token);
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

  decodeToken(token: string): any | null {
    if (token) {
      try {
        return jwtDecode(token);
      } catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
      }
    }
    return null;
  }

}
