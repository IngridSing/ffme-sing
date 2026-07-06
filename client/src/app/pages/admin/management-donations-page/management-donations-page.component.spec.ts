import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementDonationsPageComponent } from './management-donations-page.component';

describe('ManagementDonationsPageComponent', () => {
  let component: ManagementDonationsPageComponent;
  let fixture: ComponentFixture<ManagementDonationsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementDonationsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementDonationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
