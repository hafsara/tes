import { TestBed } from '@angular/core/testing';

import { FormContainerService } from './form-container.service';

describe('FormContainerService', () => {
  let service: FormContainerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormContainerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
