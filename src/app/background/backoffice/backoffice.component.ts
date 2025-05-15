import { Component } from '@angular/core';
import { GraficaComponent } from '../grafica/grafica.component';
import { GraficaCComponent } from '../graficaC/grafica-c/grafica-c.component';

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [GraficaComponent, GraficaCComponent],
  templateUrl: './backoffice.component.html',
  styleUrls: ['./backoffice.component.scss']
})
export class BackofficeComponent {

}
