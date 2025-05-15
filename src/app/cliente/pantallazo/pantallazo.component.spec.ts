import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PantallazoComponent } from './pantallazo.component';

describe('PantallazoComponent', () => {
  let component: PantallazoComponent;
  let fixture: ComponentFixture<PantallazoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantallazoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PantallazoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
