import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('sso_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Create a new application
   * @param appData Application data
   * @returns The application created
   */
  createApplication(appData: { name: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/applications`, appData, { headers });
  }

  /**
   * Retrieve all API tokens
   * @returns List of API tokens
   */
  getTokens(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.baseUrl}/api-tokens`, { headers });
  }

  /**
   * Generate a new API token
   * @param tokenData Data for the token
   * @returns Generated Token
   */
  generateToken(tokenData: { app_names: string[]; token_name: string, expiration: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/generate-api-token`, tokenData, { headers });
  }

  /**
   * Delete an API token
   * @param token Token to revoke
   * @returns Confirmation of deletion
   */
  revokeToken(token: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/revoke-api-token`, {
      headers,
      body: { token },
    });
  }

  /**
   * Regenerate an API token
   * @param oldToken Token to regenerate
   * @returns Rotation confirmation
   */
  rotateToken(oldToken: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.baseUrl}/rotate-api-token`, { oldToken }, { headers });
  }
}
