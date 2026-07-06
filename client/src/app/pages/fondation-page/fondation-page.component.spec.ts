import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FondationPageComponent } from './fondation-page.component';

describe('FondationPageComponent', () => {
  let component: FondationPageComponent;
  let fixture: ComponentFixture<FondationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FondationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FondationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
