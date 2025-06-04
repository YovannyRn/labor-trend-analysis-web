import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficasMultiplesComponent } from './graficas-multiples.component';

describe('GraficasMultiplesComponent', () => {
  let component: GraficasMultiplesComponent;
  let fixture: ComponentFixture<GraficasMultiplesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficasMultiplesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraficasMultiplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
