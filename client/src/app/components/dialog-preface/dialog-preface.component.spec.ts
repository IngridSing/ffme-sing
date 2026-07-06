import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPrefaceComponent } from './dialog-preface.component';

describe('DialogPrefaceComponent', () => {
  let component: DialogPrefaceComponent;
  let fixture: ComponentFixture<DialogPrefaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogPrefaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPrefaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
