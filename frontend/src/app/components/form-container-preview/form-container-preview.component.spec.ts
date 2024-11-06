import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormContainerPreviewComponent } from './form-container-preview.component';

describe('FormContainerPreviewComponent', () => {
  let component: FormContainerPreviewComponent;
  let fixture: ComponentFixture<FormContainerPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormContainerPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormContainerPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
