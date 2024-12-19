import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {jwtDecode} from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'auth_token';

  constructor(private router: Router) {}

  // Vérifie si l'utilisateur est authentifié
  async isAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem(this.tokenKey);

    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && !this.isTokenExpired(decoded)) {
        return true;
      } else {
        this.logout();
        return false;
      }
    } else {
      return false;
    }
  }

  // Vérifie si le token est expiré
  private isTokenExpired(decodedToken: any): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  }

  // Démarre le processus de login avec une URL de retour
  login(returnUrl: string): void {
    const encodedReturnUrl = encodeURIComponent(returnUrl);
    window.location.href = `http://localhost:5000/auth/login?returnUrl=${encodedReturnUrl}`;
  }

  // Décode un token JWT
  decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Erreur lors du décodage du token :', error);
      return null;
    }
  }

  // Déconnecte l'utilisateur
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/']); // Redirige vers la page d'accueil ou de login
  }
}
