import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaz para la respuesta de N8N
interface N8nResponse {
  message?: string;
  output?: string;
  sources?: string[] | string;
  fuentes_utilizadas?: string[];
  response_type?: string;
  structured_data?: any;
  [key: string]: any;
}

// Interfaz para fuente procesada
interface ProcessedSource {
  url: string;
  title: string;
  description?: string;
  domain: string;
  displayUrl: string;
  timestamp?: string;
}

@Component({
  selector: 'app-sources-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sources-display.component.html',
  styleUrls: ['./sources-display.component.scss'],
})
export class SourcesDisplayComponent implements OnInit, OnChanges {
  @Input() sources: string[] | string | N8nResponse | any = [];
  @Input() title: string = 'Fuentes Utilizadas';
  @Output() close = new EventEmitter<void>();

  processedSources: ProcessedSource[] = [];
  hasValidSources: boolean = false;
  ngOnInit() {
    this.processSources();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sources']) {
      console.log('🔄 Sources-display: Recibido nuevo input:', this.sources);
      this.processSources();
    }
  }

  /**
   * Procesa las fuentes desde cualquier formato de respuesta de N8N
   */
  private processSources(): void {
    console.log('🔍 Sources-display: Procesando fuentes:', this.sources);

    let extractedSources: string[] = [];

    // Caso 1: Es una respuesta completa de N8N
    if (this.isN8nResponse(this.sources)) {
      extractedSources = this.extractSourcesFromN8nResponse(this.sources);
    } // Caso 2: Ya es un array de strings
    else if (Array.isArray(this.sources)) {
      extractedSources = this.sources.filter(
        (source: any) => typeof source === 'string'
      );
    }
    // Caso 3: Es un string JSON (formato ["Instituto Nacional...", "..."])
    else if (typeof this.sources === 'string' && this.sources.trim()) {
      extractedSources = this.parseStringJsonSources(this.sources);
    }
    // Caso 4: Es un objeto con propiedades de fuentes conocidas
    else if (typeof this.sources === 'object' && this.sources !== null) {
      extractedSources = this.extractSourcesFromObject(this.sources);
    } // Filtrar, validar y limpiar fuentes
    const cleanedSources = extractedSources
      .filter((source) => this.isValidSource(source))
      .map((source) => this.cleanSource(source))
      .filter((source) => source && source.length > 0)
      .filter((source, index, array) => array.indexOf(source) === index); // Eliminar duplicados

    // Convertir strings a objetos ProcessedSource
    this.processedSources = cleanedSources.map((source, index) =>
      this.createProcessedSource(source, index)
    );

    this.hasValidSources = this.processedSources.length > 0;

    console.log(
      `✅ Sources-display: Procesadas ${this.processedSources.length} fuentes válidas:`,
      this.processedSources
    );
  }

  /**
   * Determina si el input es una respuesta completa de N8N
   */
  private isN8nResponse(input: any): input is N8nResponse {
    return (
      input &&
      typeof input === 'object' &&
      (input.message !== undefined ||
        input.output !== undefined ||
        input.response_type !== undefined ||
        input.sources !== undefined ||
        input.fuentes_utilizadas !== undefined ||
        input.structured_data !== undefined)
    );
  }
  /**
   * Extrae fuentes desde una respuesta completa de N8N
   */
  private extractSourcesFromN8nResponse(response: N8nResponse): string[] {
    const sources: string[] = [];

    console.log('🔍 Analizando respuesta N8N para fuentes:', {
      response_type: response.response_type,
      has_sources: !!response.sources,
      has_fuentes_utilizadas: !!response.fuentes_utilizadas,
      has_message: !!response.message,
      has_output: !!response.output,
    });

    // SOLO extraer fuentes de campos específicos de fuentes, NO del mensaje de texto
    // para evitar false positives en respuestas de chat normales

    // 1. Verificar sources directamente
    if (response.sources) {
      if (typeof response.sources === 'string') {
        // Manejar sources como string JSON
        const parsedSources = this.parseStringJsonSources(response.sources);
        sources.push(...parsedSources);
      } else if (Array.isArray(response.sources)) {
        sources.push(
          ...response.sources.filter((s: any) => typeof s === 'string')
        );
      }
    }

    // 2. Verificar fuentes_utilizadas
    if (
      response.fuentes_utilizadas &&
      Array.isArray(response.fuentes_utilizadas)
    ) {
      sources.push(
        ...response.fuentes_utilizadas.filter((s: any) => typeof s === 'string')
      );
    }

    // 3. Verificar structured_data
    if (
      response.structured_data?.fuentes_utilizadas &&
      Array.isArray(response.structured_data.fuentes_utilizadas)
    ) {
      sources.push(
        ...response.structured_data.fuentes_utilizadas.filter(
          (s: any) => typeof s === 'string'
        )
      );
    }

    // 4. SOLO extraer desde message si NO es una respuesta de tipo "text"
    // Esto evita que respuestas de chat normales muestren fuentes falsas
    if (
      response.response_type !== 'text' &&
      response.message &&
      typeof response.message === 'string'
    ) {
      const messageSource = this.extractSourcesFromText(response.message);
      sources.push(...messageSource);
    }

    // 5. Extraer desde output
    if (response.output && typeof response.output === 'string') {
      const outputSources = this.extractSourcesFromText(response.output);
      sources.push(...outputSources);
    }

    // 6. Buscar en todas las propiedades del objeto
    Object.keys(response).forEach((key) => {
      if (
        key.toLowerCase().includes('fuente') ||
        key.toLowerCase().includes('source')
      ) {
        const value = response[key];
        if (typeof value === 'string') {
          const extracted = this.parseStringJsonSources(value);
          sources.push(...extracted);
        } else if (Array.isArray(value)) {
          sources.push(...value.filter((s) => typeof s === 'string'));
        }
      }
    });

    return sources;
  }

  /**
   * Intenta parsear un string como JSON de fuentes
   */
  private parseStringJsonSources(sourceString: string): string[] {
    if (!sourceString || typeof sourceString !== 'string') {
      return [];
    }

    const trimmed = sourceString.trim();

    // Caso 1: Es un JSON array como string
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          console.log('✅ Fuentes parseadas desde string JSON:', parsed);
          return parsed.filter(
            (item: any) => typeof item === 'string' && item.trim()
          );
        }
      } catch (error) {
        console.warn('⚠️ Error parseando string JSON:', error);
      }
    }

    // Caso 2: Es un JSON object como string
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return this.extractSourcesFromObject(parsed);
      } catch (error) {
        console.warn('⚠️ Error parseando objeto JSON:', error);
      }
    }

    // Caso 3: Tratar como fuente individual si tiene contenido válido
    if (this.looksLikeValidSource(trimmed)) {
      return [trimmed];
    }

    return [];
  }

  /**
   * Extrae fuentes desde un objeto genérico
   */ private extractSourcesFromObject(obj: any): string[] {
    const sources: string[] = [];

    if (!obj || typeof obj !== 'object') {
      return sources;
    }

    // Buscar propiedades conocidas de fuentes
    const sourceKeys = [
      'sources',
      'fuentes_utilizadas',
      'fuentes',
      'referencias',
    ];
    for (const key of sourceKeys) {
      if (obj[key]) {
        if (Array.isArray(obj[key])) {
          sources.push(...obj[key].filter((s: any) => typeof s === 'string'));
        } else if (typeof obj[key] === 'string') {
          const parsed = this.parseStringJsonSources(obj[key]);
          sources.push(...parsed);
        }
      }
    }

    return sources;
  }
  /**
   * Limpia una fuente individual removiendo caracteres corruptos y formato inadecuado
   */
  private cleanSource(source: string): string {
    if (!source || typeof source !== 'string') {
      return '';
    }

    let cleaned = source.trim();

    // Remover caracteres corruptos específicos que aparecen en las URLs
    cleaned = cleaned
      .replace(/["']/g, '') // Remover comillas simples y dobles
      .replace(/[\\\/]+/g, '/') // Reemplazar múltiples \ o / por una sola /
      .replace(/\/\s*\\/g, '/') // Remover patrones / \
      .replace(/\\\s*\//g, '/') // Remover patrones \ /
      .replace(/[\\]+/g, '') // Remover backslashes restantes
      .replace(/\/\.\//g, '/') // Remover patrones /./ específicos
      .replace(/\/\./g, '/') // Remover patrones /. al final
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .trim();

    // Arreglar URLs específicamente
    if (cleaned.includes('http')) {
      // Limpiar URLs con problemas comunes
      cleaned = cleaned
        .replace(/https?:\/\/+/g, 'https://') // Normalizar protocolo
        .replace(/([a-z])\/+([a-z])/gi, '$1/$2') // Arreglar slashes múltiples entre palabras
        .replace(/\/+$/, '') // Remover slashes al final
        .replace(/\/\.\//g, '/') // Remover /./ en URLs
        .replace(/\/\.$/g, '') // Remover /. al final de URLs
        .replace(/\?.*$/, ''); // Remover parámetros de query complejos si es necesario
    }

    // Remover timestamps y metadata JSON
    const jsonPattern = /\{\s*"timestamp"[\s\S]*?\}/g;
    cleaned = cleaned.replace(jsonPattern, '');

    // Remover patrones específicos de metadata
    cleaned = cleaned
      .replace(/"timestamp":\s*"[^"]*",?/g, '')
      .replace(/"[^"]*":\s*"[^"]*",?/g, '')
      .replace(/[\{\}]/g, '')
      .replace(/^\s*,+\s*|\s*,+\s*$/g, '') // Remover comas al inicio/final
      .trim();

    // Limpiar patrones adicionales problemáticos
    cleaned = cleaned
      .replace(/^["'\[\{]+|["'\]\}]+$/g, '') // Remover comillas/brackets al inicio/final
      .replace(/\s*[\(\[\{]?\s*https?:\/\/[^\s\)\]\}]*\s*[\)\]\}]?\s*/g, ' ') // Limpiar URLs envueltas en paréntesis/brackets
      .replace(/\s{2,}/g, ' ') // Normalizar espacios múltiples nuevamente
      .trim();

    return cleaned;
  }

  /**
   * Determina si un string parece ser una fuente válida
   */
  private looksLikeValidSource(text: string): boolean {
    if (!text || text.length < 5) return false;

    // Verificar si contiene URL
    if (text.match(/https?:\/\//)) return true;

    // Verificar si contiene nombres de organizaciones conocidas
    if (
      text.match(
        /\b(?:INE|SEPE|Eurostat|OCDE|OECD|LinkedIn|Indeed|Glassdoor|Stack Overflow|GitHub|Ministerio|Instituto|Banco)\b/i
      )
    ) {
      return true;
    }

    // Verificar si parece ser texto descriptivo de fuente
    if (text.match(/^[A-Za-z0-9\s\-_\.\(\),]+$/) && text.length <= 200) {
      return true;
    }

    return false;
  }
  /**
   * Valida si una fuente es válida (más permisivo para mostrar fuentes reales)
   */
  private isValidSource(source: any): boolean {
    if (!source || typeof source !== 'string') return false;

    const cleaned = source.trim();

    // Descartar si es muy corto
    if (cleaned.length < 10) return false;

    // Descartar si contiene solo metadata JSON
    if (cleaned.match(/^\{.*"timestamp".*\}$/)) {
      console.log('❌ Fuente inválida (metadata JSON):', cleaned);
      return false;
    }

    // Descartar si es solo un timestamp o fecha
    if (cleaned.match(/^\d{4}-\d{2}-\d{2}/) || cleaned.match(/^\d+$/)) {
      console.log('❌ Fuente inválida (timestamp):', cleaned);
      return false;
    }

    // Aceptar URLs directamente (fuentes más confiables)
    if (cleaned.match(/^https?:\/\//)) {
      console.log('✅ Fuente válida (URL):', cleaned);
      return true;
    }

    // Descartar palabras clave de estructura JSON obvias
    const obviousInvalidKeywords = [
      'undefined',
      'null',
      'error',
      'true',
      'false',
      '{"',
      '"}',
      '[{',
      '}]',
      '"timestamp"',
      '"created_at"',
      '"updated_at"',
    ];

    if (
      obviousInvalidKeywords.some(
        (keyword) =>
          cleaned.toLowerCase() === keyword.toLowerCase() ||
          cleaned.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      console.log('❌ Fuente inválida (palabra clave):', cleaned);
      return false;
    }

    // Aceptar nombres de organizaciones o descripciones válidas
    if (cleaned.length >= 10 && cleaned.length <= 300) {
      console.log('✅ Fuente válida (texto):', cleaned);
      return true;
    }

    console.log('❌ Fuente rechazada:', cleaned);
    return false;
  }
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
   * CAPACIDADES ACTUALES DE MANEJO DE URLS:
   *
   * 1. Extracción automática de URLs desde fuentes
   * 2. Separación inteligente entre organización y URLs
   * 3. Renderizado visual diferenciado
   * 4. Validación de URLs válidas
   * 5. Enlaces clicables que abren en nueva pestaña
   *
   * El sistema actual es suficiente para el manejo básico de URLs.
   * Solo crear un servicio separado si necesitas funcionalidades avanzadas como:
   * - Validación de existencia de URLs
   * - Extracción de metadatos
   * - Acortamiento de URLs
   * - Categorización por dominios
   */
  /**
   * Extrae todas las URLs de una fuente
   */ getSourceUrls(source: string): string[] {
    if (!source || typeof source !== 'string') {
      return [];
    }

    // Regex mejorada para capturar URLs incluso en paréntesis
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const matches = source.match(urlRegex);

    if (!matches) return [];

    // Limpiar las URLs encontradas
    return matches
      .map((url) => {
        return url
          .replace(/["']/g, '') // Remover comillas
          .replace(/[\\\/]+/g, '/') // Limpiar slashes múltiples
          .replace(/\/\s*\\/g, '/') // Remover patrones / \
          .replace(/\\\s*\//g, '/') // Remover patrones \ /
          .replace(/[\\]+/g, '') // Remover backslashes restantes
          .replace(/\/\.\//g, '/') // Remover patrones /./
          .replace(/\/\.$/g, '') // Remover /. al final
          .replace(/https?:\/\/+/g, 'https://') // Normalizar protocolo
          .replace(/\/+$/, '') // Remover slashes al final
          .trim();
      })
      .filter((url) => url.length > 10); // Filtrar URLs muy cortas
  }
  /**
   * Extrae el nombre de la organización (sin la URL)
   */
  getOrganizationName(source: string): string {
    if (!source) return '';

    // Limpiar primero la fuente
    const cleaned = this.cleanSource(source);

    // Remover URLs del texto para obtener solo el nombre
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    let cleanName = cleaned.replace(urlRegex, '');

    // Limpiar caracteres residuales
    cleanName = cleanName
      .replace(/\(\s*\)/g, '')
      .replace(/\s*-\s*$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Si queda un nombre válido, usarlo; si no, extraer del dominio
    if (cleanName && cleanName.length > 3) {
      return cleanName;
    }

    // Si no hay texto útil, intentar extraer nombre del dominio de la URL
    const urls = this.getSourceUrls(source);
    if (urls.length > 0) {
      return this.extractTitleFromUrl(urls[0]);
    }

    return source || 'Fuente desconocida';
  }

  /**
   * Extrae un título legible desde una URL
   */
  private extractTitleFromUrl(url: string): string {
    if (!url) return 'Fuente desconocida';

    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;

      // Remover www. si existe
      domain = domain.replace(/^www\./, '');

      // Mapeo de dominios conocidos a nombres amigables
      const domainMap: { [key: string]: string } = {
        'ine.es': 'Instituto Nacional de Estadística (INE)',
        'sepe.es': 'Servicio Público de Empleo Estatal (SEPE)',
        'eurostat.ec.europa.eu': 'Eurostat',
        'oecd.org':
          'Organización para la Cooperación y el Desarrollo Económicos (OCDE)',
        'linkedin.com': 'LinkedIn',
        'indeed.com': 'Indeed',
        'glassdoor.com': 'Glassdoor',
        'stackoverflow.com': 'Stack Overflow',
        'github.com': 'GitHub',
        'boe.es': 'Boletín Oficial del Estado (BOE)',
        'mites.gob.es': 'Ministerio de Trabajo y Economía Social',
        'educacion.gob.es': 'Ministerio de Educación y Formación Profesional',
        'bankofspain.es': 'Banco de España',
        'cis.es': 'Centro de Investigaciones Sociológicas (CIS)',
        'cnmc.es': 'Comisión Nacional de los Mercados y la Competencia',
      };

      // Buscar coincidencia exacta primero
      if (domainMap[domain]) {
        return domainMap[domain];
      }

      // Buscar coincidencia parcial
      for (const [key, value] of Object.entries(domainMap)) {
        if (domain.includes(key) || key.includes(domain)) {
          return value;
        }
      }

      // Si no hay mapeo, crear un título basado en el dominio
      return this.formatDomainAsTitle(domain);
    } catch (error) {
      console.warn('Error al parsear URL:', url, error);
      return url;
    }
  }

  /**
   * Convierte un dominio en un título legible
   */
  private formatDomainAsTitle(domain: string): string {
    // Remover extensiones comunes
    const cleanDomain = domain
      .replace(/\.(com|org|es|eu|gov|gob)$/, '')
      .replace(/\.(net|info|biz)$/, '');

    // Capitalizar primera letra y reemplazar guiones/puntos por espacios
    return cleanDomain
      .split(/[.-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  /**
   * Extrae fuentes desde texto plano (mensajes/output de N8N)
   * SOLO busca URLs válidas y referencias explícitas de fuentes
   */
  private extractSourcesFromText(text: string): string[] {
    if (!text || typeof text !== 'string') return [];

    const sources: string[] = [];

    // SOLO buscar URLs válidas (fuentes reales)
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const urls = text.match(urlRegex);
    if (urls) {
      sources.push(...urls);
    }

    // Intentar parsear JSON dentro del texto que contenga fuentes explícitas
    try {
      if (text.includes('fuentes_utilizadas')) {
        const jsonMatch = text.match(/\{[\s\S]*fuentes_utilizadas[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (
            parsed.fuentes_utilizadas &&
            Array.isArray(parsed.fuentes_utilizadas)
          ) {
            sources.push(...parsed.fuentes_utilizadas);
          }
        }
      }
    } catch (e) {
      // Continuar si no se puede parsear
    }
    return sources;
  }

  /**
   * Crea un objeto ProcessedSource a partir de una URL string
   */
  private createProcessedSource(
    source: string,
    index: number
  ): ProcessedSource {
    let url = source.trim();

    // Extraer título y URL si el source tiene formato "Título - URL"
    let title = `Fuente ${index + 1}`;
    let description = '';

    if (source.includes(' - http')) {
      const parts = source.split(' - http');
      if (parts.length >= 2) {
        title = parts[0].trim();
        url = 'http' + parts[1].trim();
      }
    } else if (source.includes(' http')) {
      const parts = source.split(' http');
      if (parts.length >= 2) {
        title = parts[0].trim();
        url = 'http' + parts[1].trim();
      }
    }

    // Extraer dominio
    let domain = '';
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
    } catch (e) {
      domain = 'Sitio web';
    }

    // Crear URL para mostrar (truncada)
    const displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;

    return {
      url,
      title: title || domain,
      description,
      domain,
      displayUrl,
      timestamp: new Date().toLocaleString(),
    };
  }

  /**
   * TrackBy function para optimizar el rendering
   */
  trackByUrl(index: number, source: ProcessedSource): string {
    return source.url;
  }

  /**
   * Copia una URL al portapapeles
   */
  async copyToClipboard(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      console.log('✅ URL copiada al portapapeles:', url);
      // Aquí podrías mostrar un toast de confirmación
    } catch (err) {
      console.error('❌ Error al copiar al portapapeles:', err);
      // Fallback para navegadores que no soportan clipboard API
      this.fallbackCopyToClipboard(url);
    }
  }

  /**
   * Método de fallback para copiar al portapapeles
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      console.log('✅ URL copiada al portapapeles (fallback)');
    } catch (err) {
      console.error('❌ Error en fallback de copia:', err);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Exporta las fuentes como archivo JSON
   */
  exportSources(): void {
    const exportData = {
      timestamp: new Date().toISOString(),
      sources: this.processedSources,
      total: this.processedSources.length,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `fuentes_${new Date().getTime()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    console.log('✅ Fuentes exportadas como JSON');
  }
}
