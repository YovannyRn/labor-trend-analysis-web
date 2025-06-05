import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { N8nService } from '../../services/n8n/n8n.service';
import { GraficasMultiplesComponent } from '../graficas-multiples/graficas-multiples.component';
import { SourcesDisplayComponent } from '../sources-display/sources-display.component';
import { Observable, firstValueFrom } from 'rxjs';
import {
  N8nRequest,
  N8nResponse,
  ParsedOutputData,
} from '../../services/interfaces/n8n-request.interface';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../services/auth/token.service';
import { ChatStorageService } from '../../services/chat/chat-storage.service';
import { ResponseProcessorService } from '../../services/response/response-processor.service';
import { ResponseValidatorService } from '../../services/response/response-validator.service';
import { ChatSessionManagerService } from '../../services/chat/chat-session-manager.service';
import { SidebarChatComponent } from '../sidebar-chat/sidebar-chat.component';
import {
  ChatSession,
  ChatMessage,
  ComponentData,
} from '../../services/interfaces/chat.interface';

@Component({
  selector: 'app-layout-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GraficasMultiplesComponent,
    SourcesDisplayComponent,
    SidebarChatComponent,
  ],
  templateUrl: './layout-search.component.html',
  styleUrl: './layout-search.component.scss',
})
export class LayoutSearchComponent implements OnInit {
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;
  // Propiedades de UI
  searchText = '';
  isChatMode = false;
  loading = false;
  sendAnimating = false;
  chatHistory: Array<{ user?: string; bot?: string }> = [];
  lastUserQuery = ''; // Propiedades para visualización de datos
  showMultipleGraphsComponent = false;
  multipleGraphsData: any = null;
  showSourcesComponent = false;
  sourcesData: any = null;
  showSidebar = true; // Mostrar el sidebar de chat
  isSidebarCollapsed = false; // Estado de colapso del sidebar
  // Cache y flags
  private queryCache = new Map<string, N8nResponse>();
  private isGraphRequested = false;
  private isSourcesRequested = false;
  constructor(
    private n8nService: N8nService,
    private tokenService: TokenService,
    private chatStorageService: ChatStorageService,
    private responseProcessor: ResponseProcessorService,
    private responseValidator: ResponseValidatorService,
    private chatSessionManager: ChatSessionManagerService
  ) {}
  ngOnInit() {

    const currentSession = this.chatStorageService.getCurrentSession();
    if (currentSession) {
      this.onSessionChanged(currentSession);
    } else {

      this.chatStorageService.createNewSession();
    }
  }
  async sendSearch(tipo?: 'grafica' | 'fuentes') {
    // Verificar autenticación primero
    const userId = this.tokenService.getUserId();
    const userName = this.tokenService.getUsername();



    if (!userId || !userName) {
      this.chatHistory.push({
        bot: 'No se pudo autenticar tu sesión. Por favor, inicia sesión para continuar.',
      });
      return;
    }

    if (!this.searchText.trim() && !tipo) return;

    if (tipo && !this.lastUserQuery) {
      this.chatHistory.push({
        bot: `Para solicitar ${
          tipo === 'grafica' ? 'una gráfica' : 'las fuentes'
        }, primero haz una consulta sobre el mercado laboral.`,
      });
      return;
    }

    if (
      (tipo === 'grafica' && this.isGraphRequested) ||
      (tipo === 'fuentes' && this.isSourcesRequested)
    ) {
      this.chatHistory.push({
        bot: `${tipo === 'grafica' ? '📊' : '📚'} Ya se ${
          tipo === 'grafica' ? 'generó una gráfica' : 'mostraron las fuentes'
        } para esta consulta. Para obtener ${
          tipo === 'grafica' ? 'una nueva gráfica' : 'nuevas fuentes'
        }, haz una consulta diferente.`,
      });
      return;
    }

    if (!this.isChatMode) this.isChatMode = true;
    this.loading = true;

    let message = tipo ? this.lastUserQuery : this.searchText;

    if (!tipo) {
      this.lastUserQuery = message;
      this.isGraphRequested = false;
      this.isSourcesRequested = false;
      this.searchText = '';
      this.chatHistory.push({ user: message }); 
      this.chatSessionManager.saveMessageToSession({ user: message });

      this.chatStorageService.updateLastUserQuery(message);
    }

    try {
      // Manejar cache o hacer nueva petición
      let response: N8nResponse;
      const cacheKey = `${tipo || 'chat'}:${message}`;
      if (
        this.queryCache.has(cacheKey) &&
        this.responseValidator.isValidResponse(
          this.queryCache.get(cacheKey)!,
          tipo
        )
      ) {
        response = this.queryCache.get(cacheKey)!;
      } else {
        if (this.queryCache.has(cacheKey)) this.queryCache.delete(cacheKey);
        response = await this.makeNewRequest(tipo, message);
      }

      if (this.responseValidator.isValidResponse(response, tipo)) {
        this.queryCache.set(cacheKey, response);
      }
      response = this.responseProcessor.processOutputResponse(response);

      if (!response) throw new Error('No se recibió respuesta del servicio'); // Formatear mensaje bot
      let botMsg = this.responseProcessor.formatBotResponse(response);
      if (!botMsg?.trim()) {
        botMsg =
          'La consulta fue procesada, pero no hay contenido para mostrar.';
      } // Manejar respuestas especiales según tipo o contenido
      if (
        response.response_type === 'salary_data' &&
        response.structured_data &&
        tipo === 'grafica'
      ) {
        this.handleGraphResponse(response);
        return;
      } else if (
        tipo === 'fuentes' ||
        this.responseValidator.hasSourcesInResponse(response)
      ) {
        if (this.handleSourcesResponse(response)) {
          return;
        }

      } else {
        //  Ocultar componentes si no es tipo especial
        /** TODO: Implementar lógica para ocultar componentes */
        this.showMultipleGraphsComponent = false;
        this.showSourcesComponent = false;
      }
      this.chatHistory.push({ bot: botMsg });

      this.chatSessionManager.saveMessageToSession({ bot: botMsg });

      this.loading = false;

      // Reset de altura del textarea
      if (!tipo) {
        setTimeout(() => {
          document
            .querySelectorAll('.chat-textarea, .chat-textarea-small')
            .forEach(
              (el) => ((el as HTMLTextAreaElement).style.height = 'auto')
            );
        }, 10);
      }

      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      this.handleSearchError(error, tipo);
    }
  }
  private handleGraphResponse(response: N8nResponse) {
    this.multipleGraphsData = response;
    this.showMultipleGraphsComponent = true;
    this.showSourcesComponent = false;
    this.isGraphRequested = true;
    this.loading = false;
    this.chatSessionManager.saveComponentDataToSession(
      this.multipleGraphsData,
      this.sourcesData,
      this.showMultipleGraphsComponent,
      this.showSourcesComponent
    );

    setTimeout(() => this.scrollToBottom(), 100);
  }
  private handleSourcesResponse(response: N8nResponse): boolean {
    this.sourcesData = response;
    this.showSourcesComponent = true;
    this.showMultipleGraphsComponent = false;
    this.isSourcesRequested = true;
    this.loading = false;
    this.chatSessionManager.saveComponentDataToSession(
      this.multipleGraphsData,
      this.sourcesData,
      this.showMultipleGraphsComponent,
      this.showSourcesComponent
    );

    setTimeout(() => this.scrollToBottom(), 100);
    return true;
  }
  /**
   * Detecta automáticamente si una respuesta contiene fuentes
   */
  private hasSourcesInResponse(response: N8nResponse): boolean {
    if (!response) return false;

    if (response.sources) {
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

    if (
      response.fuentes_utilizadas &&
      Array.isArray(response.fuentes_utilizadas) &&
      response.fuentes_utilizadas.length > 0
    ) {
      return true;
    }

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

    for (const [key, value] of Object.entries(response)) {
      if (
        key.toLowerCase().includes('fuente') ||
        key.toLowerCase().includes('source')
      ) {
        if (
          (typeof value === 'string' && value.length > 5) ||
          (Array.isArray(value) && value.length > 0)
        ) {
          return true;
        }
      }
    }

    return false;
  }
  private handleSearchError(error: any, tipo?: string) {
    let errorMsg = 'Lo siento, hubo un error al procesar tu consulta.';

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
      } else if (
        error.message.includes('Respuesta vacía') ||
        error.message.includes('empty response')
      ) {
        errorMsg =
          'No se recibió respuesta de los servicios. Verificando autenticación...';

        const userId = this.tokenService.getUserId();
        const userName = this.tokenService.getUsername();
        if (!userId || !userName) {
          errorMsg +=
            ' Problema de autenticación detectado. Por favor, inicia sesión nuevamente.';
        }
      }
    }

    if (!tipo) {
      this.chatHistory.push({ bot: errorMsg });
    }

    this.loading = false;
  }

  private async makeNewRequest(
    tipo: string | undefined,
    message: string
  ): Promise<N8nResponse> {
    // Obtener información real del usuario autenticado
    const userId = this.tokenService.getUserId();
    const userName = this.tokenService.getUsername();

    // Verificar que tenemos información válida del usuario
    if (!userId || !userName) {
      console.error('No se encontró información de usuario válida en el token');
      throw new Error(
        'No se pudo autenticar la solicitud. Por favor, inicia sesión nuevamente.'
      );
    }

    if (tipo === 'grafica') {
      return await firstValueFrom(
        this.n8nService.requestGraphData(message, userId, userName)
      );
    } else if (tipo === 'fuentes') {
      return await firstValueFrom(
        this.n8nService.requestSources(message, userId, userName)
      );
    } else {
      return await firstValueFrom(
        this.n8nService.sendChatMessage(message, userId, userName)
      );
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
    setTimeout(() => this.sendSearch(), 100);
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

  hideMultipleGraphs() {
    this.showMultipleGraphsComponent = false;
  }

  hideSources() {
    this.showSourcesComponent = false;
  }

  get hasLastQuery(): boolean {
    return this.lastUserQuery.trim().length > 0;
  }
 
  /**
   * Maneja el evento cuando se selecciona una sesión de chat diferente
   */
  onSessionChanged(session: ChatSession): void {
    // Limpiar la interfaz actual
    this.showMultipleGraphsComponent = false;
    this.showSourcesComponent = false;

    // Si la sesión tiene mensajes, activar modo chat
    if (session.messages && session.messages.length > 0) {
      this.isChatMode = true;

      // Cargar mensajes de la sesión en el historial actual
      this.chatHistory = session.messages.map((msg) => ({
        user: msg.user,
        bot: msg.bot,
      }));

      // Restaurar última consulta del usuario
      this.lastUserQuery = session.lastUserQuery || '';

      // Si la sesión tiene gráficas o fuentes, restaurarlas
      if (session.hasGraphics && session.graphicsData) {
        this.multipleGraphsData = session.graphicsData;
        this.showMultipleGraphsComponent = true;
        this.isGraphRequested = true;
      }

      if (session.hasSources && session.sourcesData) {
        this.sourcesData = session.sourcesData;
        this.showSourcesComponent = true;
        this.isSourcesRequested = true;
      }

      // Dar tiempo para que se actualice la UI y luego hacer scroll
      setTimeout(() => this.scrollToBottom(), 100);
    } else {
      // Si es una sesión vacía, resetear el chat
      this.chatHistory = [];
      this.isChatMode = false;
      this.lastUserQuery = '';
      this.isGraphRequested = false;
      this.isSourcesRequested = false;
    }
  }

  onNewChatRequested(): void {
    // Limpiar el estado actual
    this.chatHistory = [];
    this.lastUserQuery = '';
    this.isChatMode = false;
    this.showMultipleGraphsComponent = false;
    this.showSourcesComponent = false;
    this.isGraphRequested = false;
    this.isSourcesRequested = false;
  }

  onSidebarToggled(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed;

    setTimeout(() => {
      if (this.chatMessagesRef) {
        this.scrollToBottom();
      }
    }, 300);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;

    setTimeout(() => {
      if (this.chatMessagesRef) {
        this.scrollToBottom();
      }
    }, 300);
  }
  onNewSession(): void {
    this.onNewChatRequested();
  }


  private isValidSource(source: unknown): boolean {
    return !!source && typeof source === 'string' && source.trim().length > 3;
  }
}
