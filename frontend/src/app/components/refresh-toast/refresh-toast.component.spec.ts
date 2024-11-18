import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefreshToastComponent } from './refresh-toast.component';

describe('RefreshToastComponent', () => {
  let component: RefreshToastComponent;
  let fixture: ComponentFixture<RefreshToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RefreshToastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefreshToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
