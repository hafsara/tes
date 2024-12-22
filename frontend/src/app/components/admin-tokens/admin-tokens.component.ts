import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-tokens',
  templateUrl: './admin-tokens.component.html',
  styleUrls: ['./admin-tokens.component.scss'],
  providers: [MessageService]
})
export class AdminTokensComponent implements OnInit {
  tokens: any[] = [];

  constructor(private http: HttpClient, private messageService: MessageService) {}

  ngOnInit(): void {
    this.fetchTokens();
  }

  fetchTokens(): void {
    this.http.get<any[]>('http://localhost:5000/api/api-tokens').subscribe({
      next: (response) => {
        this.tokens = response;
      },
      error: (error) => {
        console.error('Error fetching tokens:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch tokens.' });
      }
    });
  }

  revokeToken(token: string): void {
    this.http.post('http://localhost:5000/api/revoke-api-token', { token }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Token revoked successfully.' });
        this.fetchTokens();  // Refresh token list
      },
      error: (error) => {
        console.error('Error revoking token:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to revoke token.' });
      }
    });
  }
}
