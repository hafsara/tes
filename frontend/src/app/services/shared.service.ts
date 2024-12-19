import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface UserInfo {
  uid: string | null;
  username: string | null;
  avatar: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private userInfoSubject = new BehaviorSubject<UserInfo>({
    uid: null,
    username: null,
    avatar: null,
  });

  public userInfo$ = this.userInfoSubject.asObservable();

  constructor() {}

  setUserInfo(userInfo: Partial<UserInfo>) {
    const current = this.userInfoSubject.getValue();
    this.userInfoSubject.next({ ...current, ...userInfo });
  }

  getUserInfo(): UserInfo {
    return this.userInfoSubject.getValue();
  }
}
