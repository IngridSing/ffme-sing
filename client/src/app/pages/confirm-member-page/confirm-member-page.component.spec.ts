import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmMemberPageComponent } from './confirm-member-page.component';

describe('ConfirmMemberPageComponent', () => {
  let component: ConfirmMemberPageComponent;
  let fixture: ComponentFixture<ConfirmMemberPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmMemberPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmMemberPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
