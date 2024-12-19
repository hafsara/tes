import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SharedService } from '../../services/shared.service';


@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})

export class AuthComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const accessToken = params['accessToken'];
      const returnUrl = params['returnUrl'] || '/dashboard';

      try {
        const userInfo = await this.authService.fetchSSOInfo();

        if (userInfo) {
          this.authService.storeToken(userInfo.sso_token);

          this.sharedService.setUserInfo({
            uid: userInfo.sub,
            username: userInfo.username,
            avatar: userInfo.avatar,
          });

          if (accessToken) {
            const reconstructedUrl = `/user-view/${accessToken}`;
            this.router.navigateByUrl(reconstructedUrl);
          } else {
            this.router.navigateByUrl(returnUrl);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
