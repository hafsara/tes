import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewFormResponseComponent } from './preview-form-response.component';

describe('PreviewFormResponseComponent', () => {
  let component: PreviewFormResponseComponent;
  let fixture: ComponentFixture<PreviewFormResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PreviewFormResponseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewFormResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
