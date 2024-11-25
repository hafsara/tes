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

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.tokenService.tokenUpdates.pipe(
      map((tokens) => {
        if (tokens.length === 0) {
          this.router.navigate(['/access-control']);
          return false;
        }

        const appName = route.params['appName'];
        if (appName) {
          const connectedAppNames = this.tokenService.getAppNames().map((app) => app.name);
          if (connectedAppNames.includes(appName)) {
            return true;
          } else {
            console.error(`Unauthorized: appName '${appName}' is not in connected apps`);
            this.router.navigate(['/access-control']);
            return false;
          }
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/access-control']);
        return [false];
      })
    );
  }
}
