import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementProductPageComponent } from './management-product-page.component';

describe('ManagementProductPageComponent', () => {
  let component: ManagementProductPageComponent;
  let fixture: ComponentFixture<ManagementProductPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementProductPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementProductPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
