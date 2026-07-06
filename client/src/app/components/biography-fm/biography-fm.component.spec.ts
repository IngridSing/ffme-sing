import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiographyFmComponent } from './biography-fm.component';

describe('BiographyFmComponent', () => {
  let component: BiographyFmComponent;
  let fixture: ComponentFixture<BiographyFmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiographyFmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiographyFmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
