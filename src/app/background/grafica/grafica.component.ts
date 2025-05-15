import { Component } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-grafica',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './grafica.component.html',
  styleUrls: ['./grafica.component.scss']
})
export class GraficaComponent {

  data = [
    {
      "name": "2020",
      "series": [
        { "name": "Tecnología", "value": 7300000 },
        { "name": "Salud", "value": 5400000 },
        { "name": "Educación", "value": 3200000 },
        { "name": "Construcción", "value": 2100000 }
      ]
    },
    {
      "name": "2021",
      "series": [
        { "name": "Tecnología", "value": 8940000 },
        { "name": "Salud", "value": 6200000 },
        { "name": "Educación", "value": 4000000 },
        { "name": "Construcción", "value": 2500000 }
      ]
    },
    {
      "name": "2022",
      "series": [
        { "name": "Tecnología", "value": 10450000 },
        { "name": "Salud", "value": 7100000 },
        { "name": "Educación", "value": 4800000 },
        { "name": "Construcción", "value": 3000000 }
      ]
    },
    {
      "name": "2023",
      "series": [
        { "name": "Tecnología", "value": 12000000 },
        { "name": "Salud", "value": 8000000 },
        { "name": "Educación", "value": 5500000 },
        { "name": "Construcción", "value": 3500000 }
      ]
    },
    {
      "name": "2024",
      "series": [
        { "name": "Tecnología", "value": 13500000 },
        { "name": "Salud", "value": 9000000 },
        { "name": "Educación", "value": 6200000 },
        { "name": "Construcción", "value": 4000000 }
      ]
    },
    {
      "name": "2025",
      "series": [
        { "name": "Tecnología", "value": 15000000 },
        { "name": "Salud", "value": 10000000 },
        { "name": "Educación", "value": 7000000 },
        { "name": "Construcción", "value": 4500000 }
      ]
    }
  ];

  // Esquema de colores personalizado
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'] // Colores para cada sector
  };

}


