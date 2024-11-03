import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFormContainerComponent } from './create-form-container.component';

describe('CreateFormContainerComponent', () => {
  let component: CreateFormContainerComponent;
  let fixture: ComponentFixture<CreateFormContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateFormContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateFormContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
