import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { sSOGuard } from './sso.guard';

describe('sSOGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => sSOGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
