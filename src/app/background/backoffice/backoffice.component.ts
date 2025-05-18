import { Component } from '@angular/core';
import { GraficaComponent } from '../grafica/grafica.component';
import { GraficaCComponent } from '../graficaC/grafica-c/grafica-c.component';
import { LayoutBackComponent } from '../layout-back/layout-back.component';
import { LayoutSearchComponent } from '../layout-search/layout-search.component';

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [
    GraficaComponent,
    GraficaCComponent,
    LayoutSearchComponent,
  ],
  templateUrl: './backoffice.component.html',
  styleUrls: ['./backoffice.component.scss'],
})
export class BackofficeComponent {}
