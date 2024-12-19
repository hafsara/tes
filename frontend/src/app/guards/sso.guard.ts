import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SharedService } from '../services/shared.service'; //todo test

export const sSOGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const sharedService = inject(SharedService);
  const router = inject(Router);

  const ssoToken = authService.getToken();

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
      router.navigate(['/auth'], { queryParams: { accessToken } });
    } else {
      router.navigate(['/auth']);
    }
    return false;
  }
};
