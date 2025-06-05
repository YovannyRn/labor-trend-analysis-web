import { Injectable } from '@angular/core';
import { N8nResponse } from '../interfaces/n8n-request.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResponseValidatorService {

  isValidResponse(response: N8nResponse, tipo?: string): boolean {
    if (!response) {
      if (!environment.production)
      return false;
    }

    // Verificar mensaje de error
    const responseText = response.message || '';
    if (
      responseText.includes('Respuesta vacía de n8n') ||
      responseText.toLowerCase().includes('error') ||
      responseText.toLowerCase().includes('no se pudo')
    ) {
      if (!environment.production)
      return false;
    }

    // Validaciones específicas por tipo
    if (tipo === 'fuentes') {
      return this.validateSourcesResponse(response);
    }

    if (tipo === 'grafica') {
      return this.validateGraphResponse(response);
    }

    return responseText.length > 0 && !responseText.includes('undefined');
  }


  hasSourcesInResponse(response: N8nResponse): boolean {
    if (!response) return false;


    // 1. Verificar propiedades directas de fuentes
    if (response.sources) {
      // Verificar si sources es un string JSON válido
      if (typeof response.sources === 'string' && response.sources.trim()) {
        try {
          if (response.sources.startsWith('[')) {
            const parsed = JSON.parse(response.sources);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return true;
            }
          }
        } catch (e) {
          return false;
        }
      } else if (
        Array.isArray(response.sources) &&
        response.sources.length > 0
      ) {
        return true;
      }
    }

    // 2. Verificar fuentes_utilizadas
    if (
      response.fuentes_utilizadas &&
      Array.isArray(response.fuentes_utilizadas) &&
      response.fuentes_utilizadas.length > 0
    ) {
      return true;
    }

    // 3. Verificar structured_data
    if (
      response.structured_data?.fuentes_utilizadas &&
      Array.isArray(response.structured_data.fuentes_utilizadas) &&
      response.structured_data.fuentes_utilizadas.length > 0
    ) {
      return true;
    }


    if (response.response_type === 'sources_info') {
      return true;
    }
    return false;
  }


  private validateSourcesResponse(response: N8nResponse): boolean {
    // Verificar si sources es un string que contiene JSON
    let hasJsonSources = false;
    if (response.sources && typeof response.sources === 'string') {
      const sourcesStr = response.sources;
      try {
        if (sourcesStr.startsWith('[')) {
          const parsedSources = JSON.parse(sourcesStr);
          hasJsonSources =
            Array.isArray(parsedSources) && parsedSources.length > 0;
        }
      } catch (e) {
        console.warn('Error al analizar sources como JSON', e);
      }
    }

    // Verificar todas las posibles fuentes
    const hasBasicSources =
      hasJsonSources ||
      (Array.isArray(response.sources) && response.sources.length > 0) ||
      (response.fuentes_utilizadas && response.fuentes_utilizadas.length > 0) ||
      (response.structured_data?.fuentes_utilizadas &&
        response.structured_data.fuentes_utilizadas.length > 0) ||
      (response.message && response.message.trim().length > 0) ||
      (response.output && response.output.trim().length > 0) ||
      response.response_type === 'sources_info'; // Aceptar si el tipo de respuesta es sources_info

    return hasBasicSources;
  }

  /**
   * Valida respuestas específicas de gráficas
   */
  private validateGraphResponse(response: N8nResponse): boolean {
    return (
      response.structured_data &&
      typeof response.structured_data === 'object' &&
      response.response_type === 'salary_data'
    );
  }
}
