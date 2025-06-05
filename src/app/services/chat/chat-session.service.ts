import { Injectable } from '@angular/core';

export interface ChatSession {
  id: string;
  chatHistory: { user?: string; bot?: string }[];
  lastUserQuery: string;
  isChatMode: boolean;
  multipleGraphsData: any;
  sourcesData: string[];
  showMultipleGraphsComponent: boolean;
  showSourcesComponent: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatSessionService {
  private readonly STORAGE_KEY = 'labor_trend_chat_session';
  private readonly HISTORY_KEY = 'labor_trend_chat_history';

  constructor() { }

  /**
   * Guardar sesión actual
   */
  saveCurrentSession(sessionData: Partial<ChatSession>): void {
    try {
      const session: ChatSession = {
        id: this.generateSessionId(),
        chatHistory: sessionData.chatHistory || [],
        lastUserQuery: sessionData.lastUserQuery || '',
        isChatMode: sessionData.isChatMode || false,
        multipleGraphsData: sessionData.multipleGraphsData || null,
        sourcesData: sessionData.sourcesData || [],
        showMultipleGraphsComponent: sessionData.showMultipleGraphsComponent || false,
        showSourcesComponent: sessionData.showSourcesComponent || false,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  }

  /**
   * Cargar la sesión guardada
   */
  loadCurrentSession(): ChatSession | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        return session;
      }
    } catch (error) {
      console.error('Error cargando sesión:', error);
    }
    return null;
  }

  /**
   * Limpiar la sesión actual
   */
  clearCurrentSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Verificar si hay una sesión guardada
   */
  hasStoredSession(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Guardar en historial de sesiones
   */
  saveToHistory(session: ChatSession): void {
    try {
      const history = this.getSessionHistory();
      history.unshift(session);
      const limitedHistory = history.slice(0, 10);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error guardando en historial:', error);
    }
  }

  /**
   * Obtener historial de sesiones
   */
  getSessionHistory(): ChatSession[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error cargando historial:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de almacenamiento
   */
  getStorageStats(): { sessionExists: boolean; historyCount: number; lastSaved?: string } {
    const session = this.loadCurrentSession();
    const history = this.getSessionHistory();
    
    return {
      sessionExists: !!session,
      historyCount: history.length,
      lastSaved: session?.timestamp
    };
  }

  /**
   * Generar ID único para la sesión
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}