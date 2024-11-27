import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.tokenService.isBrowser()) {
      console.error('localStorage is not available in the server environment');
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

    const appName = route.params['appName'];
    if (appName) {
      const connectedAppNames = tokens.map((token: string) => {
        const decoded = this.tokenService.decodeToken(token);
        return decoded?.application_name || 'Unknown';
      });

      if (!connectedAppNames.includes(appName)) {
        console.error(`Unauthorized: appName '${appName}' is not in connected apps`);
        this.router.navigate(['/access-control']);
        return false;
      }
    }
    return true;
  }
}
