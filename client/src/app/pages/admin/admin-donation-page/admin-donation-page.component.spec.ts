import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDonationPageComponent } from './admin-donation-page.component';

describe('AdminDonationPageComponent', () => {
  let component: AdminDonationPageComponent;
  let fixture: ComponentFixture<AdminDonationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDonationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDonationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
