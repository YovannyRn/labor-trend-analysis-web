import { Injectable } from '@angular/core';
import { ChatStorageService } from '../chat/chat-storage.service';
import { ChatMessage, ComponentData } from '../interfaces/chat.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatSessionManagerService {
  constructor(private chatStorageService: ChatStorageService) {}
  /**
   * Guarda un mensaje en la sesión actual
   */
  saveMessageToSession(message: { user?: string; bot?: string }): void {
    const currentSession = this.chatStorageService.getCurrentSession();
    if (!currentSession) return;

    const chatMessage: ChatMessage = {
      timestamp: Date.now(),
      ...message,
    };

    this.chatStorageService.addMessage(chatMessage);
  }

  /**
   * Genera un título automático desde un mensaje
   */
  generateTitleFromMessage(message: string): string {
    const cleaned = message.trim();

    if (cleaned.length <= 50) {
      return cleaned;
    }

    const firstSentence = cleaned.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length <= 50) {
      return firstSentence;
    }

    return cleaned.substring(0, 47) + '...';
  }
  /**
   * Guarda datos de componentes en la sesión actual
   */
  saveComponentDataToSession(
    multipleGraphsData?: any,
    sourcesData?: any,
    showMultipleGraphsComponent?: boolean,
    showSourcesComponent?: boolean
  ): void {
    const currentSession = this.chatStorageService.getCurrentSession();
    if (!currentSession) return;

    this.chatStorageService.updateComponentData({
      multipleGraphsData,
      sourcesData,
      showMultipleGraphsComponent: showMultipleGraphsComponent || false,
      showSourcesComponent: showSourcesComponent || false,
    });
  }
  /**
   * Carga datos de componentes desde la sesión
   */
  loadComponentDataFromSession(): ComponentData | null {
    const currentSession = this.chatStorageService.getCurrentSession();
    if (!currentSession) return null;

    return {
      graphs: currentSession.graphicsData,
      sources: currentSession.sourcesData,
    };
  }
  /**
   * Limpia caché corrupto
   */
  clearCorruptedCache(): void {
    try {
      const sessions = this.chatStorageService.getAllSessions();
      sessions.forEach((session) => {
        if (session.messages) {
          session.messages = session.messages.filter(
            (msg) => msg && (msg.user || msg.bot) && msg.timestamp
          );
        }
      });
    } catch (error) {
      console.warn('Error al limpiar caché:', error);
      // En caso de error severo, limpiar todo
      this.chatStorageService.clearAllSessions();
    }
  }
}
