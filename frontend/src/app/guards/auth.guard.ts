import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.tokenService.isBrowser()) {
      return false;
    }

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

    const connectedAppNames = tokens.map((token: string) => {
      const decoded = this.tokenService.decodeToken(token);
      return decoded?.application_name || 'Unknown';
    });

    const isAdmin = tokens.some((token: string) => {
      const decoded = this.tokenService.decodeToken(token);
      return decoded?.application_name === 'admin';
    });

    const hasOtherApps = connectedAppNames.length > 1;

    if (isAdmin && !hasOtherApps) {
      const currentRoute = route.routeConfig?.path;

      if (currentRoute !== 'admin/settings') {
        this.router.navigate(['/admin/settings']);
        return false;
      }
    }

    const appName = route.params['appName'];
    if (appName) {
      if (!connectedAppNames.includes(appName)) {
        this.router.navigate(['/access-control']);
        return false;
      }
    }

    return true;
  }
}
