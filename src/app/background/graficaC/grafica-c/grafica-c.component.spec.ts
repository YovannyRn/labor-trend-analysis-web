import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficaCComponent } from './grafica-c.component';

describe('GraficaCComponent', () => {
  let component: GraficaCComponent;
  let fixture: ComponentFixture<GraficaCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficaCComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraficaCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
