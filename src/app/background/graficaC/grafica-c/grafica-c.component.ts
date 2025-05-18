import { Component } from '@angular/core';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-grafica-c',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './grafica-c.component.html',
  styleUrls: ['./grafica-c.component.scss']
})
export class GraficaCComponent {
  data = [
    { "name": "Tecnología", "value": 40 },
    { "name": "Salud", "value": 25 },
    { "name": "Educación", "value": 20 },
    { "name": "Construcción", "value": 15 }
  ];

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'] 
  };


}
