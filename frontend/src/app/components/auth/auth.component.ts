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
    this.route.queryParams.subscribe((params) => {
      const accessToken = params['accessToken'];

      this.authService.fetchSSOInfo().subscribe(
        (userInfo) => {
          this.authService.storeToken(userInfo.token);
          const decodeToken = this.authService.decodeToken(userInfo.token)
          this.sharedService.setUserInfo({
            uid: decodeToken.sub,
            username: decodeToken.username,
            avatar: decodeToken.username,
          });
          if (accessToken){
            this.router.navigate([`/user-view/${accessToken}`]);
          }else {
            this.router.navigate(['/dashboard']);
          }

        },
        (error) => {
          console.error('Error during authentication:', error);
          this.router.navigate(['/dashboard']);
        }
      );
    });
  }
}
