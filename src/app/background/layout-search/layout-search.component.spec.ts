import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutSearchComponent } from './layout-search.component';

describe('LayoutSearchComponent', () => {
  let component: LayoutSearchComponent;
  let fixture: ComponentFixture<LayoutSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
