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
   * Créer une nouvelle application
   * @param appData Données de l'application
   * @returns L'application créée
   */
  createApplication(appData: { name: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/applications`, appData, { headers });
  }

  /**
   * Récupérer tous les tokens API
   * @returns Liste des tokens API
   */
  getTokens(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.baseUrl}/api-tokens`, { headers });
  }

  /**
   * Générer un nouveau token API
   * @param tokenData Données pour le token
   * @returns Token généré
   */
  generateToken(tokenData: { app_names: string[]; token_name: string, expiration: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/generate-api-token`, tokenData, { headers });
  }

  /**
   * Supprimer un token API
   * @param token Token à révoquer
   * @returns Confirmation de suppression
   */
  revokeToken(token: string): Observable<any> {
    // const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/revoke-api-token`, {body: { token }});
  }
}
