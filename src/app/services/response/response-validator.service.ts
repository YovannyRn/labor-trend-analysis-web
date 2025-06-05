import { Injectable } from '@angular/core';
import { N8nResponse } from '../interfaces/n8n-request.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResponseValidatorService {
  /**
   * Valida si una respuesta es válida según el tipo solicitado
   */
  isValidResponse(response: N8nResponse, tipo?: string): boolean {
    if (!response) {
      if (!environment.production) console.debug('❌ Respuesta inválida: nula');
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
        console.debug(
          `❌ Respuesta contiene error: ${responseText.substring(0, 50)}...`
        );
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

  /**
   * Detecta automáticamente si una respuesta contiene fuentes válidas
   * SOLO considera fuentes explícitas, NO referencias en texto de chat
   */
  hasSourcesInResponse(response: N8nResponse): boolean {
    if (!response) return false;

    // SOLO verificar propiedades específicas de fuentes, NO texto de mensajes
    // para evitar false positives en respuestas de chat normales

    // 1. Verificar propiedades directas de fuentes
    if (response.sources) {
      // Verificar si sources es un string JSON válido
      if (typeof response.sources === 'string' && response.sources.trim()) {
        try {
          if (response.sources.startsWith('[')) {
            const parsed = JSON.parse(response.sources);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('✅ Fuentes detectadas en sources como string JSON');
              return true;
            }
          }
        } catch (e) {
          // Si no es JSON válido, no considerarlo como fuentes
          return false;
        }
      } else if (
        Array.isArray(response.sources) &&
        response.sources.length > 0
      ) {
        console.log('✅ Fuentes detectadas en sources como array');
        return true;
      }
    }

    // 2. Verificar fuentes_utilizadas
    if (
      response.fuentes_utilizadas &&
      Array.isArray(response.fuentes_utilizadas) &&
      response.fuentes_utilizadas.length > 0
    ) {
      console.log('✅ Fuentes detectadas en fuentes_utilizadas');
      return true;
    }

    // 3. Verificar structured_data
    if (
      response.structured_data?.fuentes_utilizadas &&
      Array.isArray(response.structured_data.fuentes_utilizadas) &&
      response.structured_data.fuentes_utilizadas.length > 0
    ) {
      console.log(
        '✅ Fuentes detectadas en structured_data.fuentes_utilizadas'
      );
      return true;
    }

    // 4. SOLO si el response_type es específicamente "sources_info"
    if (response.response_type === 'sources_info') {
      console.log('✅ Fuentes detectadas por response_type: sources_info');
      return true;
    }

    // NO buscar en message/output para evitar false positives
    console.log('❌ No se detectaron fuentes válidas en la respuesta');
    return false;
  }

  /**
   * Valida respuestas específicas de fuentes
   */
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

          if (hasJsonSources && !environment.production) {
            console.debug(`✅ Fuentes detectadas como string JSON válido`);
          }
        }
      } catch (e) {
        console.warn('⚠️ Error al analizar sources como JSON', e);
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

    if (!environment.production) {
      console.debug(
        `🔍 Validación de fuentes: ${
          hasBasicSources ? '✅' : '❌'
        } (verificación básica)`
      );
    }

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
