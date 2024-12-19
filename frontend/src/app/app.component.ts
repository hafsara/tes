import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SharedService } from './services/shared.service';
import jwtDecode from 'jwt-decode';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    // Vérifie s'il existe un token dans l'URL (retour après login)
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        const token = params['token'];
        localStorage.setItem('auth_token', token);

        // Décoder le token pour extraire les informations utilisateur
        const decodedToken: any = jwtDecode(token);
        console.log('Utilisateur authentifié :', decodedToken);

        // Met à jour le SharedService avec les informations utilisateur
        this.sharedService.setUserInfo({
          uid: decodedToken.sub,
          username: decodedToken.username || 'Utilisateur',
          avatar: decodedToken.avatar || null,
        });

        // Redirige vers l'URL d'origine ou la page d'accueil
        const returnUrl = params['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      } else {
        // Vérifie si un token valide est présent
        const isAuthenticated = this.authService.isAuthenticated();
        if (!isAuthenticated) {
          const currentUrl = window.location.pathname; // URL actuelle
          this.authService.login(currentUrl); // Démarre le processus de login
        }
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  template: '',
})
export class AppComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Vérifie les paramètres de l'URL
    this.route.queryParams.subscribe((params) => {
      const accessToken = params['accessToken'];

      if (accessToken) {
        // Redirige vers `user-view/<accessToken>`
        this.router.navigateByUrl(`/user-view/${accessToken}`);
      } else {
        // Redirige vers le dashboard si `accessToken` est manquant
        this.router.navigateByUrl('/dashboard');
      }
    });
  }
}

