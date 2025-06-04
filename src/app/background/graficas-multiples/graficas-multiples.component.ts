import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common';
import { Color, ScaleType } from '@swimlane/ngx-charts';

// Interfaz para datos de salarios múltiples
interface SalaryData {
  response_type: 'salary_data';
  salario_promedio: {
    junior: number;
    mid: number;
    senior: number;
  };
  datos_por_region: {
    [region: string]: number;
  };
  habilidades_mejor_pagadas: {
    habilidad: string;
    salario_promedio: number;
  }[];
  tendencia_salarial: {
    factores_incremento: string[];
    demanda_mercado: string;
    proyeccion_2025: string;
  };
}

@Component({
  selector: 'app-graficas-multiples',
  standalone: true,
  imports: [NgxChartsModule, CommonModule],
  templateUrl: './graficas-multiples.component.html',
  styleUrl: './graficas-multiples.component.scss',
})
export class GraficasMultiplesComponent implements OnChanges {
  @Input() dynamicData: any = null;
  @Output() close = new EventEmitter<void>();

  // Datos procesados para cada gráfica
  salaryByLevelData: any[] = [];
  salaryByRegionData: any[] = [];
  skillsData: any[] = [];
  trendsInfo: any = {};

  // Hacer Object disponible en el template
  Object = Object;
  // Esquemas de colores especializados
  salaryLevelColorScheme: Color = {
    name: 'salaryLevels',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#2E8B57', '#FF6B6B', '#F4A460'],
  };

  regionColorScheme: Color = {
    name: 'regions',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1E88E5', '#5E35B1', '#00ACC1', '#43A047', '#FB8C00'],
  };

  skillsColorScheme: Color = {
    name: 'skills',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF5722', '#009688', '#9C27B0', '#FF9800', '#4CAF50'],
  };
  ngOnChanges(changes: SimpleChanges) {
    if (changes['dynamicData'] && this.dynamicData) {
      this.processMultipleChartsData(this.dynamicData);
    }
  }
  private processMultipleChartsData(data: any) {
    try {
      const sourceData = data.data || data;

      // Procesar datos de salarios por nivel de experiencia
      if (sourceData.salario_promedio) {
        if (typeof sourceData.salario_promedio.junior === 'object') {
          this.salaryByLevelData = [
            {
              name: 'Junior',
              value: sourceData.salario_promedio.junior.promedio,
            },
            {
              name: 'Mid-Level',
              value: sourceData.salario_promedio.mid.promedio,
            },
            {
              name: 'Senior',
              value: sourceData.salario_promedio.senior.promedio,
            },
          ];
        } else {
          this.salaryByLevelData = [
            { name: 'Junior', value: sourceData.salario_promedio.junior },
            { name: 'Mid-Level', value: sourceData.salario_promedio.mid },
            { name: 'Senior', value: sourceData.salario_promedio.senior },
          ];
        }
      }

      // Procesar datos por región
      if (sourceData.datos_por_region) {
        if (Array.isArray(sourceData.datos_por_region)) {
          this.salaryByRegionData = sourceData.datos_por_region.map(
            (regionData: any) => ({
              name: regionData.region,
              value: regionData.salario_promedio,
            })
          );
        } else {
          this.salaryByRegionData = Object.entries(
            sourceData.datos_por_region
          ).map(([region, salary]) => ({
            name: region,
            value: Number(salary),
          }));
        }
      }

      // Procesar habilidades mejor pagadas
      if (
        sourceData.habilidades_mejor_pagadas &&
        Array.isArray(sourceData.habilidades_mejor_pagadas)
      ) {
        this.skillsData = sourceData.habilidades_mejor_pagadas.map(
          (skill: any, index: number) => {
            const salaryValue =
              skill.salario_promedio ||
              skill.salario ||
              skill.valor ||
              skill.value ||
              5000000 - index * 500000;
            return {
              name:
                skill.habilidad ||
                skill.nombre ||
                skill.name ||
                `Habilidad ${index + 1}`,
              value: Number(salaryValue),
            };
          }
        );
      }

      // Procesar información de tendencias
      if (sourceData.tendencia_salarial) {
        this.trendsInfo = {
          factores_incremento:
            sourceData.tendencia_salarial.factores_influencia ||
            sourceData.tendencia_salarial.factores_incremento ||
            [],
          demanda_mercado:
            sourceData.tendencia_salarial.demanda_mercado ||
            `Tendencia ${
              sourceData.tendencia_salarial.direccion || 'estable'
            } con variación ${
              sourceData.tendencia_salarial.variacion_anual || 'N/A'
            }`,
          proyeccion_2025:
            sourceData.tendencia_salarial.proyeccion_2025 ||
            `Proyección basada en tendencia ${
              sourceData.tendencia_salarial.direccion || 'estable'
            }`,
        };
      }
    } catch (error) {
      // Silenciar errores en producción
    }
  }
  // Formatear números como moneda colombiana
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }
  // Formatear tooltips personalizados
  formatTooltip = (data: any) => {
    return `${data.name}: ${this.formatCurrency(data.value)}`;
  }; // Verificar si un objeto tiene keys
  hasKeys(obj: any): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  // Cerrar gráficas múltiples
  closeCharts() {
    this.close.emit();
  }
}
