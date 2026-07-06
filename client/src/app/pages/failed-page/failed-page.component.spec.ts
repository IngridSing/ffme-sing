import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FailedPageComponent } from './failed-page.component';

describe('FailedPageComponent', () => {
  let component: FailedPageComponent;
  let fixture: ComponentFixture<FailedPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FailedPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FailedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
