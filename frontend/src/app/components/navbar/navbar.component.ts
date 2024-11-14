import { Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from '../../services/token.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  tokens: string[] = [];
  private tokenSubscription!: Subscription;

  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {
    this.tokenSubscription = this.tokenService.tokenUpdates.subscribe((tokens: string[]) => {
      this.tokens = tokens;
    });
  }

  ngOnDestroy(): void {
    this.tokenSubscription.unsubscribe();
  }

  logout() {
    this.tokenService.logout();
  }
}
