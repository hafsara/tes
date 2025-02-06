import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Vérifie si l'application est dans un navigateur
    if (!this.tokenService.isBrowser()) {
      return false;
    }

    // Récupère les tokens stockés dans le localStorage
    const tokenData = localStorage.getItem('appTokens');
    if (!tokenData) {
      this.router.navigate(['/access-control']);
      return false;
    }

    const parsedData = JSON.parse(tokenData);
    const tokens: string[] = parsedData.tokens || [];

    if (tokens.length === 0) {
      this.router.navigate(['/access-control']);
      return false;
    }

    // Récupère le nom de l'application depuis les paramètres de la route
    const appName = route.params['appName'];
    if (appName) {
      const connectedAppNames = tokens.map((token: string) => {
        const decoded = this.tokenService.decodeToken(token);
        return decoded?.application_name || 'Unknown';
      });

      // Vérifie si l'utilisateur a accès à l'application spécifiée
      if (!connectedAppNames.includes(appName)) {
        console.error(`Unauthorized: appName '${appName}' is not in connected apps`);
        this.router.navigate(['/access-control']);
        return false;
      }
    }
    return true;
  }
}
