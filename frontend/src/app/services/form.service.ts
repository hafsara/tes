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

  submitUserForm(formData: any): Observable<any> {
      return this.http.post(
          `${this.apiUrl}/${formData.access_token}/forms/${formData.forms[0].form_id}/submit-response`,
          {
              questions: formData.forms[0].questions.map((q: any) => ({
                  id: q.id,
                  response: q.response || q.selectedOptions
              }))
          }
      );
  }

  getFormContainerTimeline(accessToken: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${accessToken}/timeline`);
  }
}
