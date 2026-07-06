import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPhotoComponent } from './form-photo.component';

describe('FormPhotoComponent', () => {
  let component: FormPhotoComponent;
  let fixture: ComponentFixture<FormPhotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPhotoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
