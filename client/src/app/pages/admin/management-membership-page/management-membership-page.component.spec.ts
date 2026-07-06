import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementMembershipPageComponent } from './management-membership-page.component';

describe('ManagementMembershipPageComponent', () => {
  let component: ManagementMembershipPageComponent;
  let fixture: ComponentFixture<ManagementMembershipPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementMembershipPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementMembershipPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
