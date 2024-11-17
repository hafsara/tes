import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PollingService {
  private apiUrl = 'https://example.com/api/endpoint'; // Remplacez par votre URL

  constructor(private http: HttpClient) {}

  pollData(interval: number = 5000): Observable<any> {
    return timer(0, interval).pipe(
      switchMap(() => this.http.get<any>(this.apiUrl))
    );
  }
}

