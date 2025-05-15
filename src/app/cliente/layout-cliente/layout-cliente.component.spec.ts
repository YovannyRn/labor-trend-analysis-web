import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutClienteComponent } from './layout-cliente.component';

describe('LayoutClienteComponent', () => {
  let component: LayoutClienteComponent;
  let fixture: ComponentFixture<LayoutClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
