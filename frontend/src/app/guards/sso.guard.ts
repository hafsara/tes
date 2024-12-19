import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SharedService } from '../services/shared.service'; //todo test

export const sSOGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const sharedService = inject(SharedService);
  const router = inject(Router);

  const ssoToken = authService.getToken(); //todo test

  if (ssoToken) {
    //todo test
    console.log('ssoToken');
              sharedService.setUserInfo({
            uid: 'hafsa',
            username: 'hafsa',
            avatar: "HR",
          });
//todo fin
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
