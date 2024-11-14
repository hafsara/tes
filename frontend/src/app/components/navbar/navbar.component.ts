import { Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from '../../services/token.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  appNames: (string | null)[] = [];
  private tokenSubscription!: Subscription;

  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {
    this.appNames = this.tokenService.getAppNames();

    this.tokenSubscription = this.tokenService.tokenUpdates.subscribe(() => {
      this.appNames = this.tokenService.getAppNames();
    });
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  logout() {
    this.tokenService.logout();
  }
}
