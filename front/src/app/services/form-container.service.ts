import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormContainerService {
  private apiUrl = 'http://localhost:3000/api/form-containers'; // Remplacez par l'URL de votre API

  constructor(private http: HttpClient) {}

  // Méthode pour obtenir tous les form containers
  getFormContainers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Méthode pour créer un nouveau form container
  createFormContainer(formContainerData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, formContainerData);
  }

  // Autres méthodes pour interagir avec l'API, par exemple pour supprimer ou mettre à jour
  deleteFormContainer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  updateFormContainer(id: number, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateData);
  }
}
