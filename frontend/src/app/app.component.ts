import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const accessToken = params['access_token'];
      const returnUrl = params['returnUrl'] || '/dashboard';

      if (accessToken) {
        this.router.navigate(['/auth'], { queryParams: { accessToken, returnUrl } });
      }
      else {
        this.router.navigate(['/auth'], { queryParams: { returnUrl } });
      }
    });
  }
}
