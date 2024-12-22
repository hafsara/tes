import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private apiBaseUrl = environment.apiUrl;
  private apiFormContainerUrl = `${environment.apiUrl}/form-containers`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('sso_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createFormContainer(formContainer: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiFormContainerUrl, formContainer,  { headers });
  }

  getFormContainerByAccessToken(accessToken: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiFormContainerUrl}/${accessToken}`, { headers });
  }

  submitUserForm(access_token: string, formData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiFormContainerUrl}/${access_token}/forms/${formData.form_id}/submit-response`,
      {
        questions: formData.questions.map((q: any) => ({
          id: q.id,
          response: q.response
        }))
      }, { headers }
    );
  }

  getFormContainerTimeline(formContainerId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiFormContainerUrl}/${formContainerId}/timeline`, { headers });
  }

  getFormContainersByStatus(appIds: string, status: string) : Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiFormContainerUrl}/apps/${appIds}?filter=status&status=${status}`;
    return this.http.get<any[]>(url, { headers });
  }


  validateFormContainer(formContainerId: number, formId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiFormContainerUrl}/${formContainerId}/forms/${formId}/validate`;
    return this.http.post(url, {}, { headers });
  }

  addFormToContainer(containerId: number, formData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiFormContainerUrl}/${containerId}/forms`;
    return this.http.post(url, formData, { headers });
  }

  validateToken(token: string): Observable<{ is_valid: boolean; token: string | null }> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiBaseUrl}/validate-token/${token}`;
    return this.http.get<{ is_valid: boolean; token: string | null }>(url, { headers });
  }

  loadCampaignOptions(appId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiBaseUrl}/campaigns/${appId}`;
    return this.http.get<any[]>(url, { headers });
  }

  createCampaign(campaign: any): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiBaseUrl}/campaigns`;
    return this.http.post(url, campaign, { headers });
  }

  cancelForm(formContainerId: string, formId: number, comment: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiFormContainerUrl}/${formContainerId}/forms/${formId}/cancel`;
    return this.http.post(url, { comment }, { headers });
  }

  getValidatedFormContainers(appIds: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiFormContainerUrl}/apps/${appIds}/validated`, { headers });
  }

  getFormById(formId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiBaseUrl}/forms/${formId}`, { headers });
  }

  getTotalFormsCount(appIds: string): Observable<{ totalCount: number }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ totalCount: number }>(`${this.apiBaseUrl}/forms/apps/${appIds}/total-count`, { headers });
  }

  logConnection(payload: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiBaseUrl}/log-connection`, payload,  { headers });
  }

}
