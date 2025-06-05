import { Injectable } from '@angular/core';
import {
  N8nResponse,
  ParsedOutputData,
} from '../interfaces/n8n-request.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResponseProcessorService {
  processOutputResponse(response: N8nResponse): N8nResponse {
    if (!response.output || typeof response.output !== 'string') {
      return response;
    }

    try {
      const cleanedOutput = response.output.trim();
      const parsed: ParsedOutputData = JSON.parse(cleanedOutput);

      return {
        ...response,
        message:
          parsed.message && typeof parsed.message === 'string'
            ? parsed.message
            : response.message,
        structured_data: parsed.structured_data || response.structured_data,
        sources: this.extractSources(parsed, response),
        fuentes_utilizadas:
          parsed.fuentes_utilizadas || response.fuentes_utilizadas,
        response_type: parsed.response_type || response.response_type,
        success:
          parsed.success !== undefined ? parsed.success : response.success,
        timestamp: parsed.timestamp || response.timestamp,
      };
    } catch (error) {
      console.warn('Error al parsear campo output:', error);
      if (response.output.length > 1000) {
        console.warn(
          'Output demasiado largo, fragmento:',
          response.output.substring(0, 200)
        );
      }
      return response;
    }
  }

  /**
   * Extrae fuentes de la respuesta parseada
   */
  private extractSources(
    parsed: ParsedOutputData,
    originalResponse: N8nResponse
  ): string[] | undefined {

    if (
      parsed.response_type === 'sources_info' ||
      originalResponse.response_type === 'sources_info'
    ) {
    }
    // Para otros tipos de respuestas, preservar fuentes existentes si ya son un array
    else if (
      originalResponse.sources &&
      Array.isArray(originalResponse.sources) &&
      originalResponse.sources.length > 0
    ) {
      return originalResponse.sources;
    }

    // Procesamiento en orden de prioridad

    // 1. Fuentes como array
    if (Array.isArray(parsed.sources)) {
      return parsed.sources;
    }

    // 2. Fuentes como string JSON
    if (typeof parsed.sources === 'string' && parsed.sources.trim()) {
      try {
        if (parsed.sources.startsWith('[') || parsed.sources.startsWith('{')) {
          const sourcesArray = JSON.parse(parsed.sources);
          if (Array.isArray(sourcesArray)) {
            return sourcesArray;
          } else if (
            typeof sourcesArray === 'object' &&
            sourcesArray !== null
          ) {
            return Object.values(sourcesArray).filter(
              (val) => typeof val === 'string'
            );
          }
        }
        return [parsed.sources];
      } catch (error) {
        console.error('❌ Error al parsear fuentes como JSON:', error);
        return [parsed.sources];
      }
    }

    // 3. Fuentes como fuentes_utilizadas
    if (
      Array.isArray(parsed.fuentes_utilizadas) &&
      parsed.fuentes_utilizadas.length > 0
    ) {
      return parsed.fuentes_utilizadas;
    }

    // 4. Fuentes en datos estructurados
    if (parsed.structured_data?.fuentes_utilizadas) {
      const structuredSources = parsed.structured_data.fuentes_utilizadas;
      if (Array.isArray(structuredSources)) return structuredSources;
    }

    // 5. Intentar con las fuentes en la respuesta original
    if (
      originalResponse.sources &&
      typeof originalResponse.sources === 'string' &&
      originalResponse.sources.trim()
    ) {
      const sourcesStr = originalResponse.sources;
      try {
        if (sourcesStr.startsWith('[')) {
          const sourcesArray = JSON.parse(sourcesStr);
          if (Array.isArray(sourcesArray)) {;
            return sourcesArray;
          }
        }
        // Si falla el parseo o no es un array, devolver como string
        return [sourcesStr];
      } catch (error) {;
        return [sourcesStr];
      }
    }
    return Array.isArray(originalResponse.sources)
      ? originalResponse.sources
      : undefined;
  }

  /**
   * Formatea la respuesta del bot
   */
  formatBotResponse(response: N8nResponse): string {
    if (!response) return 'Error: No se recibió respuesta del servidor';

    // No mostrar nada para respuestas de sólo fuentes
    if (
      response.response_type === 'sources_info' &&
      Array.isArray(response.sources) &&
      response.sources.length > 0
    ) {
      return '';
    }

    let botMsg = '';

    try {
      // Prioridad para el mensaje
      if (response.message?.trim()) {
        const message = response.message.trim();

        // Verificar si es JSON de fuentes
        if (message.startsWith('{') && message.includes('fuentes_utilizadas')) {
          try {
            const parsed = JSON.parse(message);
            if (
              parsed.response_type === 'sources_info' &&
              parsed.fuentes_utilizadas
            ) {
              return 'Aquí tienes las fuentes consultadas para esta información.';
            }
          } catch (e) {
            /* Usar mensaje original */
          }
        }

        botMsg = message;
      } else if (response.output?.trim()) {
        const outputTrimmed = response.output.trim();

        // Intentar parsear JSON
        if (outputTrimmed.startsWith('{') || outputTrimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(outputTrimmed);
            if (
              parsed.response_type === 'sources_info' ||
              parsed.fuentes_utilizadas
            ) {
              return 'Aquí tienes las fuentes consultadas para esta información.';
            }

            botMsg =
              parsed.message ||
              parsed.output ||
              parsed.content ||
              parsed.response ||
              'Información procesada correctamente';
          } catch (parseError) {
            botMsg = outputTrimmed;
          }
        } else {
          botMsg = outputTrimmed;
        }
      } else {
        botMsg = 'Respuesta procesada correctamente';
      }

      if (!botMsg?.trim()) botMsg = 'La consulta fue procesada correctamente';

      // Agregar nota sobre datos estructurados
      if (
        response.response_type === 'salary_data' &&
        response.structured_data
      ) {
        botMsg += '\n\n*Datos estructurados disponibles para gráfica*';
      }

      return this.applyMarkdownFormatting(botMsg);
    } catch (error) {
      return 'Error al procesar la respuesta del servidor';
    }
  }

  /**
   * Aplica formato markdown al texto
   */
  private applyMarkdownFormatting(text: string): string {
    if (!text || typeof text !== 'string') return '';

    return text
      .replace(/###\s*([^#\n]+)/g, '<h2 class="mt-4 mb-3 text-primary">$1</h2>')
      .replace(
        /\*\*([^*]+)\*\*/g,
        '<strong class="fw-semibold text-warning">$1</strong>'
      )
      .replace(
        /-\s*([^:\n]+):\s*/g,
        '<br><strong class="text-warning">$1</strong><br>'
      )
      .replace(/:\s*\n/g, '<br><br>')
      .replace(/\n-\s+/g, '<br>• ')
      .replace(/\n\*\s+/g, '<br>• ')
      .replace(/\n\d+\.\s+/g, '<br>$&')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }
}
