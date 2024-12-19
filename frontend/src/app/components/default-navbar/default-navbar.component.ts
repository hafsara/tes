import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-default-navbar',
  templateUrl: './default-navbar.component.html',
  styleUrls: ['./default-navbar.component.scss']
})
export class DefaultNavbarComponent implements OnInit  {
  userInfo = {
    uid: '',
    username: '',
    avatar: '',
  };

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.sharedService.userInfo$.subscribe((data) => {
      console.log(data);
      this.userInfo = {
        uid: data.uid || '',
        username: data.username || 'User',
        avatar: data.avatar || '',
      };
    });
  }
}
