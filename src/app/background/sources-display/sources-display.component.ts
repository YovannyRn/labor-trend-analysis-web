import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sources-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sources-display.component.html',
  styleUrls: ['./sources-display.component.scss'],
})
export class SourcesDisplayComponent {
  @Input() sources: string[] = [];
  @Input() title: string = 'Fuentes Utilizadas';

  /**
   * Convierte una fuente removiendo las URLs para evitar duplicación
   */
  formatSourceWithLink(source: string): string {
    if (!source || typeof source !== 'string') {
      return source || '';
    }

    // Regex para capturar URLs completas
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;

    // Limpiar el texto removiendo URLs y caracteres residuales
    let cleanText = source
      .replace(urlRegex, '') // Remover URLs completas
      .replace(/\(\s*\)/g, '') // Remover paréntesis vacíos
      .replace(/\s*-\s*$/g, '') // Remover guiones al final
      .replace(/\s*-\s*\s*$/g, '') // Remover guiones con espacios al final
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .trim(); // Remover espacios al inicio y final

    return cleanText;
  }

  /**
   * Extrae todas las URLs de una fuente
   */
  getSourceUrls(source: string): string[] {
    if (!source || typeof source !== 'string') {
      return [];
    }

    // Regex mejorada para capturar URLs incluso en paréntesis
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const matches = source.match(urlRegex);
    return matches || [];
  }

  /**
   * Extrae el nombre de la organización (sin la URL)
   */
  getOrganizationName(source: string): string {
    if (!source) return '';

    // Remover URLs del texto para obtener solo el nombre
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    let cleanName = source.replace(urlRegex, '');

    // Limpiar caracteres residuales
    cleanName = cleanName
      .replace(/\(\s*\)/g, '') 
      .replace(/\s*-\s*$/g, '') 
      .replace(/\s+/g, ' ') 
      .trim(); 

    return cleanName;
  }
}
