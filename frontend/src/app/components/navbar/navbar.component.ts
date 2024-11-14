import { Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from '../../services/token.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  appOptions: { label: string; value: string }[] = []; // Options for p-multiSelect
  selectedApps: string[] = []; // Selected application names
  private tokenSubscription!: Subscription;

  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {
    const appNames = this.tokenService.getAppNames();
    this.appOptions = appNames.map(appName => ({ label: appName || 'Unknown', value: appName || '' }));

    this.selectedApps = appNames.filter(name => name !== null) as string[];

    this.tokenSubscription = this.tokenService.tokenUpdates.subscribe(() => {
      const updatedAppNames = this.tokenService.getAppNames();
      this.appOptions = updatedAppNames.map(appName => ({ label: appName || 'Unknown', value: appName || '' }));
      this.selectedApps = updatedAppNames.filter(name => name !== null) as string[];
    });
  }

  onAppSelectionChange(): void {
    console.log('Selected applications:', this.selectedApps);
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
