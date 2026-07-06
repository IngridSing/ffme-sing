import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementNewsPageComponent } from './management-news-page.component';

describe('ManagementNewsPageComponent', () => {
  let component: ManagementNewsPageComponent;
  let fixture: ComponentFixture<ManagementNewsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementNewsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementNewsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
