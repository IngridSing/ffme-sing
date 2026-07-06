import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmOrderPageComponent } from './confirm-order-page.component';

describe('ConfirmOrderPageComponent', () => {
  let component: ConfirmOrderPageComponent;
  let fixture: ComponentFixture<ConfirmOrderPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmOrderPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmOrderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
