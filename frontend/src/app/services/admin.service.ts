import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly baseUrl = 'http://localhost:5000'; // Remplacez par l'URL de votre backend

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les applications
   * @returns Liste des applications
   */
  getApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/applications`);
  }

  /**
   * Récupérer tous les tokens API existants
   * @returns Liste des tokens API
   */
  getTokens(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tokens`);
  }

  /**
   * Créer un nouveau token API
   * @param tokenData Informations du token
   * @returns Le token créé
   */
  createToken(tokenData: {
    tokenName: string;
    application: string;
    expirationDays: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tokens`, tokenData);
  }

  /**
   * Supprimer un token API
   * @param tokenId ID du token à supprimer
   * @returns Confirmation de la suppression
   */
  deleteToken(tokenId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/tokens/${tokenId}`);
  }

  /**
   * Récupérer toutes les campagnes associées à une application
   * @param appId ID de l'application
   * @returns Liste des campagnes
   */
  getCampaigns(appId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/campaigns/${appId}`);
  }

  /**
   * Créer une nouvelle application
   * @param appData Données de l'application
   * @returns L'application créée
   */
  createApplication(appData: { name: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/applications`, appData);
  }

  /**
   * Créer une nouvelle campagne
   * @param campaignData Données de la campagne
   * @returns La campagne créée
   */
  createCampaign(campaignData: {
    name: string;
    app_id: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/campaigns`, campaignData);
  }
}
