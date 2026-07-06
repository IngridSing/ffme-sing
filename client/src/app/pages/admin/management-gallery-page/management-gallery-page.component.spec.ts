import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementGalleryPageComponent } from './management-gallery-page.component';

describe('ManagementGalleryPageComponent', () => {
  let component: ManagementGalleryPageComponent;
  let fixture: ComponentFixture<ManagementGalleryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementGalleryPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementGalleryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
