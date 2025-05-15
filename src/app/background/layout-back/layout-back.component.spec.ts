import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutBackComponent } from './layout-back.component';

describe('LayoutBackComponent', () => {
  let component: LayoutBackComponent;
  let fixture: ComponentFixture<LayoutBackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutBackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutBackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
