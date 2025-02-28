import { Component } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})

export class AdminPanelComponent {
  appOptions: { name: string; token: string }[] = [];
  selectedTab: string = 'workflows';
  swaggerUrl: string = `${environment.apiUrl}/api/docs`;
  hasApps: boolean = true;

  constructor(private sharedService: SharedService) {
  }

  onAppOptionsLoaded(options: { name: string; token: string }[]): void {
    this.appOptions = options.filter(app => app.name !== 'admin');
    this.hasApps = this.appOptions.length > 0;
    if (!this.hasApps) {
      this.selectedTab = 'workflows'
    }
  }

  isAuthorized(): boolean {
    const userInfo = this.sharedService.getUserInfo();
      const isUserAuthorized = userInfo && userInfo.uid && environment.authorizedUsers.includes(userInfo.uid);
      const isFromAdminApp = this.appOptions.some(option => option.name === 'admin');
      return isUserAuthorized || isFromAdminApp;
  }

}
