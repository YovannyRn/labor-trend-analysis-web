import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { N8nRequest, N8nResponse } from '../interfaces/n8n-request.interface';
import { TokenService } from '../auth/token.service';
import { UseStateService } from '../auth/use-state.service';

@Injectable({
  providedIn: 'root',
})
export class N8nService {
  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private useStateService: UseStateService
  ) {} // Método principal para enviar mensajes
  async sendMessage(
    message: string,
    requestType: 'chat' | 'graph' | 'sources' = 'chat'
  ): Promise<N8nResponse> {
    console.log('📤 Enviando mensaje:', { message, requestType });
    console.log(`🌐 URL del endpoint: ${environment.apiUrl}/n8n/process`);

    const request: N8nRequest = {
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      message: message,
      request_type: requestType,
    };

    console.log('📦 Request completo:', request);

    try {
      const startTime = Date.now();
      console.log('⏱️ Iniciando petición HTTP...');

      const backendResponse = await this.http
        .post<N8nResponse>(`${environment.apiUrl}/n8n/process`, request)
        .toPromise();

      const duration = Date.now() - startTime;
      console.log(`⏱️ Petición completada en ${duration}ms`);
      console.log('🔗 Respuesta raw del backend:', backendResponse);
      console.log(
        '📏 Tamaño de respuesta:',
        JSON.stringify(backendResponse).length,
        'caracteres'
      );

      if (!backendResponse) {
        console.error('❌ Backend response es null/undefined');
        throw new Error('No se recibió respuesta del backend');
      } // Análisis detallado de la respuesta
      if (
        (typeof backendResponse.message === 'string' &&
          (backendResponse.message.includes('Respuesta vacía') ||
            backendResponse.message.trim() === '')) ||
        (typeof backendResponse.output === 'string' &&
          (backendResponse.output.includes('Respuesta vacía') ||
            backendResponse.output.trim() === ''))
      ) {
        console.error('⚠️ DETECTADO: Respuesta vacía de n8n');
        console.error(
          '🔍 Esto indica que el workflow de n8n no está conectado correctamente'
        );
        console.error(
          '💡 Verifica que Code1 esté conectado al resto del flujo'
        );
      }

      const mappedResponse = this.mapBackendResponse(
        backendResponse,
        requestType
      );
      console.log('✅ Respuesta mapeada final:', mappedResponse);

      return mappedResponse;
    } catch (error) {
      console.error('❌ Error al enviar mensaje a N8N:', error);

      // Manejo específico según el tipo de error
      if (error instanceof Error) {
        if (error.message.includes('Http failure')) {
          return this.createErrorResponse(
            'Error de conexión con el servidor. Verifica tu conexión a internet.'
          );
        } else if (error.message.includes('timeout')) {
          return this.createErrorResponse(
            'La consulta está tardando más de lo esperado. Intenta de nuevo.'
          );
        }
      }

      return this.createErrorResponse(
        'Error al procesar tu consulta. Por favor, intenta de nuevo.'
      );
    }
  } // Método compatible con el componente existente
  sendUserRequest(request: N8nRequest): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/n8n/process`, request);
  }

  // Métodos de conveniencia para tipos específicos
  async sendChatMessage(message: string): Promise<N8nResponse> {
    return this.sendMessage(message, 'chat');
  }

  async requestGraphData(message: string): Promise<N8nResponse> {
    return this.sendMessage(message, 'graph');
  }

  async requestSources(message: string): Promise<N8nResponse> {
    return this.sendMessage(message, 'sources');
  }
  private mapBackendResponse(
    backendResponse: N8nResponse,
    requestType: string
  ): N8nResponse {
    console.log('🔄 Mapeando respuesta del backend:', backendResponse);
    console.log('🏷️ Request Type recibido:', requestType);

    try {
      // Validación inicial
      if (!backendResponse) {
        console.error('❌ Backend response es null o undefined');
        return this.createErrorResponse('No se recibió respuesta del backend');
      }

      // Si hay output JSON, parsearlo
      if (
        backendResponse.output &&
        typeof backendResponse.output === 'string' &&
        backendResponse.output.trim().startsWith('{')
      ) {
        try {
          const parsedData = JSON.parse(backendResponse.output);
          console.log('✅ JSON parseado correctamente:', parsedData);

          const detectedType = this.detectResponseType(parsedData, requestType);
          console.log('🔎 Tipo de respuesta detectado:', detectedType);

          const result = {
            success: backendResponse.success ?? true,
            response_type: detectedType,
            message: this.extractMessage(parsedData, backendResponse),
            structured_data: parsedData.structured_data || parsedData.data,
            sources: this.extractSources(parsedData),
            output: backendResponse.output,
          };

          console.log('📦 Respuesta final mapeada:', result);
          return result;
        } catch (jsonError) {
          console.warn('⚠️ Error al parsear JSON del output:', jsonError);
          console.warn(
            '🔧 Output que falló al parsear:',
            backendResponse.output
          );
          // Continuar con el flujo normal si no es JSON válido
        }
      }

      // Si es texto simple o el JSON falló
      const message = this.extractMessage(backendResponse, null);
      console.log('📝 Procesando como respuesta de texto simple');

      const textResult = {
        success: backendResponse.success ?? true,
        response_type: 'text' as const,
        message: message,
        output: backendResponse.output,
      };

      console.log('📦 Respuesta texto final:', textResult);
      return textResult;
    } catch (error) {
      console.error('❌ Error crítico al procesar respuesta:', error);
      return this.createErrorResponse(
        'Error al procesar la respuesta del servidor'
      );
    }
  }

  private extractMessage(primary: any, fallback: any = null): string {
    // Prioridad: message > output > content > response
    const candidates = [
      primary?.message,
      primary?.output,
      primary?.content,
      primary?.response,
      fallback?.message,
      fallback?.output,
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return 'Respuesta procesada correctamente';
  }
  private extractSources(data: any): string[] | undefined {
    console.log('🔍 extractSources - datos recibidos:', data);

    // Primero intentar parsear el message si es un JSON string
    let parsedData = data;
    if (data.message && typeof data.message === 'string') {
      try {
        const messageData = JSON.parse(data.message);
        console.log('📜 Message parseado exitosamente:', messageData);
        parsedData = { ...data, ...messageData };
      } catch (e) {
        console.log('⚠️ Message no es JSON válido, usando data original');
      }
    }

    // Buscar fuentes en múltiples propiedades posibles
    const rawSources =
      parsedData.fuentes_utilizadas ||
      parsedData.sources ||
      parsedData.referencias ||
      parsedData.structured_data?.fuentes_utilizadas ||
      parsedData.structured_data?.sources ||
      data.sources ||
      data.fuentes_utilizadas;

    console.log('🔍 extractSources - fuentes encontradas:', rawSources);

    if (!Array.isArray(rawSources)) {
      console.log('🔍 extractSources - no es array, retornando undefined');
      return undefined;
    }

    // Filtrar y limpiar fuentes
    const cleanedSources = rawSources
      .filter((s) => s && typeof s === 'string' && s.trim().length > 0)
      .map((source) => this.cleanSourceString(source));

    console.log('🔍 extractSources - fuentes limpiadas:', cleanedSources);
    return cleanedSources.length > 0 ? cleanedSources : undefined;
  }
  private cleanSourceString(source: string): string {
    // Limpiar y completar URLs truncadas
    let cleaned = source.trim();

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

    console.log(`🔧 Fuente limpiada: "${source}" -> "${cleaned}"`);
    return cleaned;
  }

  private createErrorResponse(message: string): N8nResponse {
    return {
      success: false,
      response_type: 'text',
      message: message,
      output: '',
    };
  }
  private detectResponseType(
    data: any,
    requestType: string
  ): 'text' | 'salary_data' | 'sector_growth' | 'sources_info' {
    console.log('🔍 Detectando tipo de respuesta:', { data, requestType });

    // Si el requestType es 'sources', siempre es sources_info
    if (requestType === 'sources') {
      console.log('✅ Detectado como sources_info (por requestType)');
      return 'sources_info';
    }

    // Si el requestType es 'graph', verificar el contenido de la respuesta
    if (requestType === 'graph') {
      // Si la respuesta de n8n incluye response_type, usarlo
      if (data.response_type === 'salary_data') {
        console.log('✅ Detectado como salary_data (por response_type de n8n)');
        return 'salary_data';
      }
      if (data.response_type === 'sector_growth') {
        console.log(
          '✅ Detectado como sector_growth (por response_type de n8n)'
        );
        return 'sector_growth';
      }

      // Si tiene datos estructurados de salario, es salary_data
      if (
        data.data?.salario_promedio ||
        data.salario_promedio ||
        data.structured_data
      ) {
        console.log('✅ Detectado como salary_data (con datos estructurados)');
        return 'salary_data';
      }

      // Si no tiene datos estructurados pero es request de graph, asumir que algo salió mal
      console.log(
        '⚠️ Request tipo "graph" pero sin datos estructurados, marcando como text'
      );
      return 'text';
    } // Verificar por contenido independientemente del requestType
    console.log('🔍 Buscando fuentes en data.sources:', data.sources);
    console.log(
      '🔍 Buscando fuentes en data.fuentes_utilizadas:',
      data.fuentes_utilizadas
    );
    console.log(
      '🔍 Buscando fuentes en data.response_type:',
      data.response_type
    );

    if (
      data.sources ||
      data.fuentes_utilizadas ||
      data.response_type === 'sources_info'
    ) {
      console.log('✅ Detectado como sources_info (por contenido)');
      return 'sources_info';
    }

    if (
      data.salario_promedio ||
      data.structured_data ||
      data.data?.salario_promedio
    ) {
      console.log('✅ Detectado como salary_data (por contenido)');
      return 'salary_data';
    }

    console.log('✅ Detectado como text (por defecto)');
    return 'text';
  }

  private getCurrentUserId(): number {
    // Por ahora usamos un ID por defecto, se puede mejorar cuando haya más info del token
    const username = this.getCurrentUserName();
    return username ? username.length * 100 : 1; // Simple hash del username
  }

  private getCurrentUserName(): string {
    // Intentar obtener de token primero, luego de sesión
    const tokenUsername = this.tokenService.getUsername();
    if (tokenUsername) {
      return tokenUsername;
    }

    const sessionUsername = this.useStateService.getUsername();
    if (sessionUsername) {
      return sessionUsername;
    }

    return 'usuario_anonimo';
  }
}
