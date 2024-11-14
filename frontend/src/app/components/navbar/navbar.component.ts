import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { TokenService } from '../../services/token.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() appOptionsLoaded = new EventEmitter<{ name: string; token: string }[]>();
  appOptions: { name: string; token: string }[] = [];
  selectedApps: string[] = [];

  private tokenSubscription!: Subscription;
  private readonly localStorageKey = 'selectedApps';

  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {
    const savedSelection = localStorage.getItem(this.localStorageKey);
    if (savedSelection) {
      this.selectedApps = JSON.parse(savedSelection);
    }

    const appData = this.tokenService.getAppNames();
    this.appOptions = appData.map(app => ({
      name: app.name || 'Unknown',
      token: app.token || ''
    }));

    if (!savedSelection) {
      this.selectedApps = appData.map(app => app.token).filter(token => token !== null) as string[];
      this.saveSelection();
    }

    this.tokenSubscription = this.tokenService.tokenUpdates.subscribe(() => {
      const updatedAppData = this.tokenService.getAppNames();
      this.appOptions = updatedAppData.map(app => ({
        name: app.name || 'Unknown',
        token: app.token || ''
      }));

      if (!savedSelection) {
        this.selectedApps = updatedAppData.map(app => app.token).filter(token => token !== null) as string[];
        this.saveSelection();
      }
    });

    this.appOptionsLoaded.emit(this.appOptions);
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  onAppSelectionChange(event: any) {
    this.selectedApps = event.value;
    this.saveSelection();
  }

  private saveSelection(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.selectedApps));
  }

  logout() {
    this.tokenService.logout();
    localStorage.removeItem(this.localStorageKey);
  }
}
