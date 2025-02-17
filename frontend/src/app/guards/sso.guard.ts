import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SharedService } from '../services/shared.service'; //todo test

export const sSOGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const sharedService = inject(SharedService);
  const router = inject(Router);

  const ssoToken = authService.getToken();
        const currentPath = route.routeConfig?.path;
        console.error('dfghjk', currentPath);
  if (ssoToken) {
      const decodedToken = authService.decodeToken(ssoToken);
      sharedService.setUserInfo({
        uid: decodedToken.sub,
        username: decodedToken.username,
        avatar: decodedToken.avatar,
      });
    return true;
  } else {
    const accessToken = route.paramMap.get('access_token');
    if (accessToken) {
        const currentPath = route.routeConfig?.path;
        if (currentPath?.startsWith('user-view')) {
            console.error('Route détectée : user-view');
            router.navigate(['/auth'], { queryParams: { accessToken, view: 'user' } });
        } else if (currentPath?.includes('dashboard') && currentPath?.includes('load-form')) {
            console.error('Route détectée : dashboard/load-form');
            router.navigate(['/auth'], { queryParams: { accessToken, view: 'dashboard' } });
        } else {
            console.warn('Route inconnue');
            router.navigate(['/auth'], { queryParams: { accessToken } });
        }
    } else {
        router.navigate(['/auth']);
    }
    return false;
  }
};
