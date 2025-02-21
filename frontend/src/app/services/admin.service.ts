import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly baseUrl = environment.apiUrl;

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
  createApplication(appData: { name: string , mail_sender: string}): Observable<any> {
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
   * Retrieve all API tokens
   * @returns List of API tokens
   */
  getApplications(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.baseUrl}/applications`, { headers });
  }

  /**
   * Generate a new API token
   * @param tokenData Data for the token
   * @returns Generated Token
   */
  generateToken(tokenData: { app_names: string[]; token_name: string, expiration: Date }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/api-tokens`, tokenData, { headers });
  }

  /**
   * Delete an API token
   * @param token Token to revoke
   * @returns Confirmation of deletion
   */
  revokeToken(token: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/api-tokens/${token}`, {headers});
  }

  /**
   * Regenerate an API token
   * @param old_token Token to regenerate
   * @returns Rotation confirmation
   */
  rotateToken(token_name: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.baseUrl}/api-tokens/rotate`, { token_name }, { headers });
  }

  /**
   * Update a existing application
   * @param appData Application data
   * @returns Update confirmation
   */
  updateApplication(appId: string, updatedData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.baseUrl}/applications/${appId}`, updatedData, { headers });
  }
}
