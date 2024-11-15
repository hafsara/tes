import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private apiUrl = `${environment.apiUrl}/form-containers`;

  constructor(private http: HttpClient) {}

  createFormContainer(formContainer: any): Observable<any> {
    return this.http.post(this.apiUrl, formContainer);
  }

  getFormContainerByAccessToken(accessToken: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${accessToken}`);
  }

  submitUserForm(access_token:string, formData: any): Observable<any> {
      return this.http.post(
          `${this.apiUrl}/${access_token}/forms/${formData.form_id}/submit-response`,
          {
              questions: formData.questions.map((q: any) => ({
                  id: q.id,
                  response: q.response || q.selectedOptions
              }))
          }
      );
  }

  getFormContainerTimeline(formContainerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${formContainerId}/timeline`);
  }

  getFormContainersByStatus(appIds: string, status: string) : Observable<any> {
      const url = `${this.apiUrl}/apps/${appIds}?filter=status&status=${status}`;
      return this.http.get<any[]>(url);
  }


  validateFormContainer(formContainerId: number, formId: number): Observable<any> {
    const url = `${this.apiUrl}/${formContainerId}/forms/${formId}/validate`;
    return this.http.post(url, {});
  }

  addFormToContainer(containerId: number, formData: any): Observable<any> {
    console.log(containerId, formData)
    const url = `${this.apiUrl}/${containerId}/forms`;
    return this.http.post(url, formData);
  }

  validateToken(token: string): Observable<{ is_valid: boolean; token: string | null }> {
    const url = `${environment.apiUrl}/validate-token/${token}`;
    return this.http.get<{ is_valid: boolean; token: string | null }>(url);
  }

  loadCampaignOptions(appId: string): Observable<any> {
    const url = `${environment.apiUrl}/campaigns/${appId}`;
    return this.http.get<any[]>(url);
  }

  createCampaign(campaign: any): Observable<any> {
    const url = `${environment.apiUrl}/campaigns`;
    return this.http.post(url, campaign);
  }
}
