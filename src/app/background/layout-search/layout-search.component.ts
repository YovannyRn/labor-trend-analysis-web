import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { N8nService } from '../../services/n8n/n8n.service';
import { GraficasMultiplesComponent } from '../graficas-multiples/graficas-multiples.component';
import { SourcesDisplayComponent } from '../sources-display/sources-display.component';
import {
  N8nRequest,
  N8nResponse,
} from '../../services/interfaces/n8n-request.interface';

@Component({
  selector: 'app-layout-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GraficasMultiplesComponent,
    SourcesDisplayComponent,
  ],
  templateUrl: './layout-search.component.html',
  styleUrl: './layout-search.component.scss',
})
export class LayoutSearchComponent implements OnInit {
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;
  searchText = '';
  isChatMode = false;
  loading = false;
  sendAnimating = false;
  chatHistory: Array<{ user?: string; bot?: string }> = [];
  // Nueva propiedad para guardar la última consulta
  lastUserQuery = '';

  // ⭐ NUEVA: Cache para evitar consultas repetidas
  private queryCache = new Map<string, N8nResponse>();
  private isGraphRequested = false; // Evitar múltiples solicitudes de gráfica
  private isSourcesRequested = false; // Evitar múltiples solicitudes de fuentes

  graphData: any = null;
  // Nuevas propiedades para gráficas múltiples
  showMultipleGraphsComponent = false;
  multipleGraphsData: any = null;
  showSourcesComponent = false;
  sourcesData: string[] = [];

  constructor(private n8nService: N8nService) {}
  // Inicialización del componente
  ngOnInit() {
    // Limpiar caché corrupto al inicio
    this.clearCorruptedCache();
  }
  async sendSearch(tipo?: 'grafica' | 'fuentes') {
    // Si no hay texto y tampoco hay última consulta para los botones, salir
    if (!this.searchText.trim() && !tipo) return;

    // Si es un botón (grafica/fuentes) pero no hay consulta previa
    if (tipo && !this.lastUserQuery) {
      this.chatHistory.push({
        bot: `Para solicitar ${
          tipo === 'grafica' ? 'una gráfica' : 'las fuentes'
        }, primero haz una consulta sobre el mercado laboral.`,
      });
      return;
    } // Verificar si ya se solicitó gráfica/fuentes para evitar duplicados
    if (tipo === 'grafica' && this.isGraphRequested) {
      this.chatHistory.push({
        bot: '📊 Ya se generó una gráfica para esta consulta. Para obtener una nueva gráfica, haz una consulta diferente.',
      });
      return;
    }

    if (tipo === 'fuentes' && this.isSourcesRequested) {
      this.chatHistory.push({
        bot: '📚 Ya se mostraron las fuentes para esta consulta. Para obtener nuevas fuentes, haz una consulta diferente.',
      });
      return;
    }

    if (!this.isChatMode) {
      this.isChatMode = true;
    }

    this.loading = true; // Determinar qué mensaje usar
    let message: string;
    if (tipo) {
      // Si es un botón, usar la consulta anterior
      message = this.lastUserQuery;
    } else {
      // Si es un mensaje nuevo, usar el texto actual y guardarlo
      message = this.searchText;
      this.lastUserQuery = message; // Guardar para uso futuro

      // Resetear flags cuando hay nueva consulta
      this.isGraphRequested = false;
      this.isSourcesRequested = false;

      // Limpiar el input inmediatamente después de capturar el texto
      this.searchText = '';

      // Agregar mensaje del usuario al historial solo si no es un botón
      this.chatHistory.push({ user: message });
    }
    try {
      let response: N8nResponse; // Verificar si la consulta ya está en caché y es válida
      const cacheKey = `${tipo || 'chat'}:${message}`;
      if (this.queryCache.has(cacheKey)) {
        const cachedResponse = this.queryCache.get(cacheKey)!;
        // Validar que la respuesta en caché sea válida
        if (this.isValidResponse(cachedResponse, tipo)) {
          response = cachedResponse;
        } else {
          this.queryCache.delete(cacheKey);
          response = await this.makeNewRequest(tipo, message);
        }
      } else {
        response = await this.makeNewRequest(tipo, message);
      }

      // Solo guardar en caché si la respuesta es válida
      if (this.isValidResponse(response, tipo)) {
        this.queryCache.set(cacheKey, response);
      }

      // Validar que la respuesta sea válida
      if (!response) {
        throw new Error('No se recibió respuesta del servicio');
      }
      let botMsg = this.formatBotResponse(response);

      // Validar que el mensaje formateado no esté vacío
      if (!botMsg || botMsg.trim() === '') {
        botMsg =
          'La consulta fue procesada, pero no hay contenido para mostrar.';
      } // Si la respuesta contiene datos estructurados y es de tipo gráfica, mostrar componente
      if (
        response.response_type === 'salary_data' &&
        response.structured_data &&
        tipo === 'grafica'
      ) {
        // Verificar si los datos tienen la estructura de múltiples gráficas
        const hasMultipleChartData = this.hasMultipleChartStructure(
          response.structured_data
        );
        if (hasMultipleChartData) {
          this.multipleGraphsData = response.structured_data;
          this.showMultipleGraphsComponent = true;
        } else {
          // Si no tiene estructura múltiple, usar gráfica simple
          this.graphData = response.structured_data;
          this.showMultipleGraphsComponent = false;
        }
        this.showSourcesComponent = false; // Ocultar fuentes si se muestra gráfica

        // Marcar que ya se solicitó gráfica
        this.isGraphRequested = true;

        // NO agregar mensaje al chat cuando es un botón de gráfica
        // Solo mostrar el componente
        this.loading = false;
        setTimeout(() => this.scrollToBottom(), 100);
        return; // Salir temprano, no agregar al historial
      } else if (
        response.response_type === 'sources_info' &&
        tipo === 'fuentes'
      ) {
        // Buscar fuentes en múltiples propiedades posibles
        const rawSources =
          response.sources ||
          response.fuentes_utilizadas ||
          response.structured_data?.fuentes_utilizadas ||
          [];

        // Validar y filtrar fuentes más estrictamente
        const validSources = Array.isArray(rawSources)
          ? rawSources.filter((source: any) => {
              const isValidString = source && typeof source === 'string';
              const hasContent = isValidString && source.trim().length > 0;
              const notErrorText =
                isValidString &&
                !source.includes('undefined') &&
                !source.includes('null') &&
                !source.includes('Respuesta vacía') &&
                !source.toLowerCase().includes('error');

              const isValid = isValidString && hasContent && notErrorText;

              return isValid;
            })
          : [];
        if (validSources.length === 0) {
          // No hay fuentes válidas, mostrar mensaje informativo en el chat
          this.chatHistory.push({
            bot: '📚 Esta respuesta se basa en conocimiento general. No se identificaron fuentes específicas para citar en esta consulta particular.',
          });

          // Resetear flag para permitir intentar nuevamente
          this.isSourcesRequested = false;

          this.loading = false;
          setTimeout(() => this.scrollToBottom(), 100);
          return;
        }

        // Hay fuentes válidas, mostrar componente
        this.sourcesData = validSources;
        this.showSourcesComponent = true;
        this.showMultipleGraphsComponent = false; // Ocultar gráficas múltiples

        // Marcar que ya se solicitaron fuentes exitosamente
        this.isSourcesRequested = true;

        // NO agregar mensaje al chat cuando es un botón de fuentes exitoso
        // Solo mostrar el componente
        this.loading = false;
        setTimeout(() => this.scrollToBottom(), 100);
        return; // Salir temprano, no agregar al historial
      } else {
        // Ocultar ambos componentes si no es el tipo adecuado
        this.showMultipleGraphsComponent = false;
        this.showSourcesComponent = false;
      }

      this.chatHistory.push({ bot: botMsg });
      this.loading = false;

      // Resetear la altura del textarea solo si se envió un mensaje nuevo
      if (!tipo) {
        setTimeout(() => {
          const textareas = document.querySelectorAll(
            '.chat-textarea, .chat-textarea-small'
          );
          textareas.forEach((textarea) => {
            (textarea as HTMLTextAreaElement).style.height = 'auto';
          });
        }, 10);
      }

      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Error en sendSearch:', error);

      let errorMsg = 'Lo siento, hubo un error al procesar tu consulta.';

      // Mensajes de error específicos según el tipo
      if (tipo === 'grafica') {
        errorMsg =
          'No se pudieron generar las gráficas para esta consulta. Intenta con una pregunta sobre salarios o datos específicos.';
      } else if (tipo === 'fuentes') {
        errorMsg =
          'No se pudieron obtener las fuentes para esta consulta. Intenta de nuevo.';
      } else if (error instanceof Error) {
        if (error.message.includes('conexión')) {
          errorMsg =
            'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
        } else if (error.message.includes('timeout')) {
          errorMsg =
            'La consulta está tardando más de lo esperado. Intenta con una pregunta más específica.';
        }
      }

      // Solo agregar al historial si no es un botón que falló
      if (!tipo) {
        this.chatHistory.push({ bot: errorMsg });
      } else {
        // Para botones que fallan, mostrar mensaje temporal
        // Opcionalmente, podrías mostrar un toast o notificación temporal aquí
      }

      this.loading = false;
    }
  }

  sendSearchWithAnimation() {
    this.sendAnimating = true;
    setTimeout(() => {
      this.sendAnimating = false;
      this.sendSearch();
    }, 150);
  }

  sendPredefinedMessage(message: string) {
    this.searchText = message;
    setTimeout(() => {
      this.sendSearch();
    }, 100);
  }

  handleEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendSearchWithAnimation();
    }
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  scrollToBottom() {
    if (this.chatMessagesRef) {
      const element = this.chatMessagesRef.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // Método para ocultar las gráficas múltiples
  hideMultipleGraphs() {
    this.showMultipleGraphsComponent = false;
  }

  // Método para ocultar las fuentes
  hideSources() {
    this.showSourcesComponent = false;
  }

  // Métodos para verificar si hay consulta previa disponible
  get hasLastQuery(): boolean {
    return this.lastUserQuery.trim().length > 0;
  }

  private formatBotResponse(response: N8nResponse): string {
    let botMsg = '';

    try {
      // Validar que response existe
      if (!response) {
        return 'Error: No se recibió respuesta del servidor';
      }

      // Si es una respuesta de solo fuentes, no mostrar en chat
      if (
        response.response_type === 'sources_info' &&
        response.sources &&
        response.sources.length > 0
      ) {
        return ''; // No mostrar nada en el chat, solo en el componente de fuentes
      }

      // Determinar el mensaje a mostrar con mejor validación
      if (
        response.message &&
        typeof response.message === 'string' &&
        response.message.trim()
      ) {
        const message = response.message.trim();

        // Si el mensaje es un JSON de fuentes, no mostrarlo
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
            // Si no se puede parsear, usar el mensaje original
          }
        }

        botMsg = message;
      } else if (
        response.output &&
        typeof response.output === 'string' &&
        response.output.trim()
      ) {
        const outputTrimmed = response.output.trim();

        // Intentar parsear si es JSON válido
        if (outputTrimmed.startsWith('{') || outputTrimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(outputTrimmed);

            // Si es JSON de fuentes, usar mensaje simplificado
            if (
              parsed.response_type === 'sources_info' ||
              parsed.fuentes_utilizadas
            ) {
              return 'Aquí tienes las fuentes consultadas para esta información.';
            }

            // Extraer mensaje del JSON parseado
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

      // Validar que botMsg no esté vacío
      if (!botMsg || botMsg.trim() === '') {
        botMsg = 'La consulta fue procesada correctamente';
      }
    } catch (error) {
      botMsg = 'Error al procesar la respuesta del servidor';
    } // NO agregar información adicional si es un request específico de componente
    try {
      if (
        response.response_type === 'salary_data' &&
        response.structured_data
      ) {
        botMsg += '\n\n*Datos estructurados disponibles para gráfica*';
      }
    } catch (error) {
      // Error handling for additional info
    }

    // Aplicar formateo de markdown de forma segura
    try {
      return this.applyMarkdownFormatting(botMsg);
    } catch (error) {
      return botMsg; // Retornar sin formateo si hay error
    }
  }
  private applyMarkdownFormatting(text: string): string {
    if (!text || typeof text !== 'string') {
      return text || '';
    }

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
  // Método para detectar estructura de gráficas múltiples
  private hasMultipleChartStructure(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Verificar si tiene la estructura de SalaryData directa
    const hasDirectStructure =
      data.salario_promedio &&
      data.datos_por_region &&
      data.habilidades_mejor_pagadas &&
      data.tendencia_salarial;

    if (hasDirectStructure) {
      return true;
    }

    // Verificar si tiene estructura anidada con datos complejos
    const hasNestedStructure =
      data.data &&
      typeof data.data === 'object' &&
      data.data.salario_promedio &&
      data.data.datos_por_region &&
      data.data.habilidades_mejor_pagadas;

    if (hasNestedStructure) {
      return true;
    }

    // Verificar estructura compleja legacy
    const hasComplexStructure =
      data.data &&
      typeof data.data === 'object' &&
      (data.data.salario_promedio || data.data.datos_por_region);

    if (hasComplexStructure) {
      return true;
    }

    return false;
  } // ⭐ NUEVO: Validar si una respuesta es válida para guardar en caché
  private isValidResponse(response: N8nResponse, tipo?: string): boolean {
    if (!response) {
      return false;
    }

    // Verificar que no sea un mensaje de error
    const responseText = response.message || '';
    if (
      responseText.includes('Respuesta vacía de n8n') ||
      responseText.includes('Error') ||
      responseText.includes('error') ||
      responseText.toLowerCase().includes('no se pudo')
    ) {
      return false;
    }

    // Validaciones específicas por tipo
    if (tipo === 'fuentes') {
      // Para fuentes, debe tener response_type correcto
      if (response.response_type !== 'sources_info') {
        return false;
      }

      // Verificar que tenga al menos una fuente válida
      const rawSources =
        response.sources ||
        response.fuentes_utilizadas ||
        response.structured_data?.fuentes_utilizadas ||
        [];

      const validSources = Array.isArray(rawSources)
        ? rawSources.filter(
            (source: any) =>
              source &&
              typeof source === 'string' &&
              source.trim().length > 0 &&
              !source.includes('undefined') &&
              !source.includes('null') &&
              !source.includes('Respuesta vacía') &&
              !source.toLowerCase().includes('error')
          )
        : [];

      if (validSources.length === 0) {
        return false;
      }

      return true;
    }

    if (tipo === 'grafica') {
      const hasData =
        response.structured_data &&
        typeof response.structured_data === 'object';
      if (!hasData) {
        return false;
      }
      return response.response_type === 'salary_data';
    }

    // Para chat normal, verificar que tenga contenido válido
    return responseText.length > 0 && !responseText.includes('undefined');
  }
  // ⭐ NUEVO: Hacer nueva petición a N8N
  private async makeNewRequest(
    tipo: string | undefined,
    message: string
  ): Promise<N8nResponse> {
    if (tipo === 'grafica') {
      return await this.n8nService.requestGraphData(message);
    } else if (tipo === 'fuentes') {
      return await this.n8nService.requestSources(message);
    } else {
      return await this.n8nService.sendChatMessage(message);
    }
  } // Limpiar caché corrupto
  clearCorruptedCache() {
    const initialSize = this.queryCache.size;
    const keysToDelete: string[] = [];

    this.queryCache.forEach((response, key) => {
      const tipo = key.split(':')[0];
      if (!this.isValidResponse(response, tipo)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.queryCache.delete(key);
    });

    const deletedCount = keysToDelete.length;

    if (deletedCount > 0) {
      this.chatHistory.push({
        bot: `🗑️ Caché limpiado: se eliminaron ${deletedCount} entradas corruptas. El sistema debería funcionar mejor ahora.`,
      });
      setTimeout(() => this.scrollToBottom(), 100);
    }

    return deletedCount;
  }
  // ⭐ NUEVO: Mostrar estadísticas del caché
  showCacheStats() {
    const stats = { chat: 0, grafica: 0, fuentes: 0, valid: 0, invalid: 0 };

    this.queryCache.forEach((response, key) => {
      const tipo = key.split(':')[0];
      if (tipo === 'chat') stats.chat++;
      else if (tipo === 'grafica') stats.grafica++;
      else if (tipo === 'fuentes') stats.fuentes++;

      if (this.isValidResponse(response, tipo)) stats.valid++;
      else stats.invalid++;
    });

    // Mostrar en UI
    this.chatHistory.push({
      bot: `📊 **Estadísticas del Caché:**\n\n**Total:** ${this.queryCache.size} entradas\n**Chat:** ${stats.chat} | **Gráficas:** ${stats.grafica} | **Fuentes:** ${stats.fuentes}\n**Válidas:** ${stats.valid} | **Inválidas:** ${stats.invalid}`,
    });
    setTimeout(() => this.scrollToBottom(), 100);
  }
  /**
   * Convierte texto con URLs en HTML con enlaces clicables
   * También completa URLs truncadas automáticamente
   */
  formatSourceWithLink(source: string): string {
    if (!source || typeof source !== 'string') {
      return source || '';
    }

    // Primero, completar URLs truncadas (igual que en n8n.service.ts)
    let cleanedSource = this.cleanAndCompleteSource(source.trim());

    // Buscar URLs en el texto (http o https)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Reemplazar URLs con enlaces HTML
    const result = cleanedSource.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" class="text-info text-decoration-none">${url}</a>`;
    });

    return result;
  }
  /**
   * Método auxiliar para completar URLs truncadas
   */
  private cleanAndCompleteSource(source: string): string {
    let cleaned = source;

    // Si termina con " -" y no tiene URL, agregar URLs conocidas
    if (cleaned.endsWith(' -') && !cleaned.includes('http')) {
      if (cleaned.includes('INE')) {
        cleaned = cleaned.replace(' -', ' - https://www.ine.es');
      } else if (cleaned.includes('Ministerio de Trabajo')) {
        cleaned = cleaned.replace(' -', ' - https://www.mites.gob.es');
      } else if (cleaned.includes('SEPE')) {
        cleaned = cleaned.replace(' -', ' - https://www.sepe.es');
      } else if (cleaned.includes('Portal de Empleo')) {
        cleaned = cleaned.replace(' -', ' - https://www.empleate.gob.es');
      } else if (cleaned.includes('Instituto de Estadística')) {
        cleaned = cleaned.replace(' -', ' - https://www.ine.es');
      } else if (cleaned.includes('Servicio Público de Empleo')) {
        cleaned = cleaned.replace(' -', ' - https://www.sepe.es');
      } else if (cleaned.includes('Ministerio de Economía')) {
        cleaned = cleaned.replace(' -', ' - https://www.mineco.gob.es');
      } else if (cleaned.includes('Eurostat')) {
        cleaned = cleaned.replace(' -', ' - https://ec.europa.eu/eurostat');
      } else if (cleaned.includes('OCDE')) {
        cleaned = cleaned.replace(' -', ' - https://www.oecd.org');
      } else if (cleaned.includes('Banco de España')) {
        cleaned = cleaned.replace(' -', ' - https://www.bde.es');
      }
    }
    // Si contiene solo el nombre de la organización sin URL, agregar URL completa
    if (!cleaned.includes('http') && !cleaned.includes('-')) {
      if (
        cleaned.toLowerCase().includes('ine') ||
        cleaned.toLowerCase().includes('instituto nacional de estadística')
      ) {
        cleaned = `${cleaned} - https://www.ine.es`;
      } else if (
        cleaned.toLowerCase().includes('sepe') ||
        cleaned.toLowerCase().includes('servicio público de empleo')
      ) {
        cleaned = `${cleaned} - https://www.sepe.es`;
      } else if (cleaned.toLowerCase().includes('ministerio de trabajo')) {
        cleaned = `${cleaned} - https://www.mites.gob.es`;
      } else if (cleaned.toLowerCase().includes('eurostat')) {
        cleaned = `${cleaned} - https://ec.europa.eu/eurostat`;
      } else if (
        cleaned.toLowerCase().includes('ocde') ||
        cleaned.toLowerCase().includes('oecd')
      ) {
        cleaned = `${cleaned} - https://www.oecd.org`;
      } else if (cleaned.toLowerCase().includes('linkedin')) {
        cleaned = `${cleaned} - https://www.linkedin.com`;
      } else if (cleaned.toLowerCase().includes('stack overflow')) {
        cleaned = `${cleaned} - https://stackoverflow.com`;
      } else if (cleaned.toLowerCase().includes('github')) {
        cleaned = `${cleaned} - https://github.com`;
      } else if (cleaned.toLowerCase().includes('glassdoor')) {
        cleaned = `${cleaned} - https://www.glassdoor.com`;
      } else if (cleaned.toLowerCase().includes('indeed')) {
        cleaned = `${cleaned} - https://www.indeed.com`;
      }
    }

    return cleaned;
  }
}
