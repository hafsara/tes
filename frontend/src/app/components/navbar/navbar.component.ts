import { Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from '../../services/token.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];
  private tokenSubscription!: Subscription;

  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {
    const appData = this.tokenService.getAppNames();
    this.appOptions = appData.map(app => ({
      name: app.name || 'Unknown',
      token: app.token || ''
    }));

    this.selectedApps = appData.map(app => app.name).filter(name => name !== null) as string[];

    this.tokenSubscription = this.tokenService.tokenUpdates.subscribe(() => {
      const updatedAppData = this.tokenService.getAppNames();
      this.appOptions = updatedAppData.map(app => ({
        name: app.name || 'Unknown',
        token: app.token || ''
      }));
      this.selectedApps = updatedAppData.map(app => app.token).filter(token => token !== null) as string[];
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
