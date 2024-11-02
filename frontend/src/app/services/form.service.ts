// src/app/services/form.service.ts
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

  createFormContainer(formContainerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, formContainerData);
  }

  addFormToContainer(containerId: number, formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${containerId}/forms`, formData);
  }
}
