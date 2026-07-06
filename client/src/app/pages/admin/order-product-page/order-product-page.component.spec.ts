import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderProductPageComponent } from './order-product-page.component';

describe('OrderProductPageComponent', () => {
  let component: OrderProductPageComponent;
  let fixture: ComponentFixture<OrderProductPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderProductPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderProductPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
