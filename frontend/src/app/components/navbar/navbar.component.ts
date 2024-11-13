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
  private tokensSubscription: Subscription = new Subscription();

  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {
    this.tokensSubscription = this.tokenService.tokens$.subscribe(
      (tokens) => {
        this.tokens = tokens;
      }
    );
  }

  ngOnDestroy(): void {
    this.tokensSubscription.unsubscribe();
  }
}
