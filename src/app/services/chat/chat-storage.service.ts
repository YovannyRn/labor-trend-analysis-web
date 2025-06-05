import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ChatSession,
  ChatMessage,
  ChatStorage,
  ChatComponentData,
} from '../interfaces/chat-storage.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatStorageService {
  private readonly STORAGE_KEY = 'labor_market_chats';
  private readonly MAX_SESSIONS = 50; // Máximo de sesiones guardadas
  private readonly CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 días

  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);
  private sessionsSubject = new BehaviorSubject<ChatSession[]>([]);

  constructor() {
    this.loadFromStorage();
    this.cleanupOldSessions();
  }

  // Observables para componentes
  get currentSession$(): Observable<ChatSession | null> {
    return this.currentSessionSubject.asObservable();
  }

  get sessions$(): Observable<ChatSession[]> {
    return this.sessionsSubject.asObservable();
  }

  // Crear nueva sesión de chat
  createNewSession(title?: string): ChatSession {
    const now = Date.now();
    const session: ChatSession = {
      id: this.generateSessionId(),
      title: title || `Chat ${this.formatDate(now)}`,
      messages: [],
      lastUserQuery: '',
      hasGraphics: false,
      hasSources: false,
      createdAt: now,
      updatedAt: now,
    };

    this.setCurrentSession(session);
    return session;
  }

  // Establecer sesión actual
  setCurrentSession(session: ChatSession): void {
    const sessions = this.sessionsSubject.value;
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, updatedAt: Date.now() };
    } else {
      sessions.unshift(session);
    }

    // Limitar número de sesiones
    if (sessions.length > this.MAX_SESSIONS) {
      sessions.splice(this.MAX_SESSIONS);
    }

    this.sessionsSubject.next([...sessions]);
    this.currentSessionSubject.next(session);
    this.saveToStorage();
  }

  // Cargar sesión existente
  loadSession(sessionId: string): ChatSession | null {
    const sessions = this.sessionsSubject.value;
    const session = sessions.find((s) => s.id === sessionId);

    if (session) {
      this.currentSessionSubject.next(session);
      return session;
    }

    return null;
  }

  // Actualizar sesión actual
  updateCurrentSession(updates: Partial<ChatSession>): void {
    const current = this.currentSessionSubject.value;
    if (!current) return;

    const updatedSession = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };

    this.setCurrentSession(updatedSession);
  }

  // Agregar mensaje a la sesión actual
  addMessage(message: ChatMessage): void {
    const current = this.currentSessionSubject.value;
    if (!current) return;

    const updatedMessages = [...current.messages, message];
    this.updateCurrentSession({ messages: updatedMessages });
  }

  // Actualizar datos de componentes
  updateComponentData(data: Partial<ChatComponentData>): void {
    const current = this.currentSessionSubject.value;
    if (!current) return;

    const updates: Partial<ChatSession> = {};

    if (data.showMultipleGraphsComponent !== undefined) {
      updates.hasGraphics = data.showMultipleGraphsComponent;
      if (data.multipleGraphsData) {
        updates.graphicsData = data.multipleGraphsData;
      }
    }

    if (data.showSourcesComponent !== undefined) {
      updates.hasSources = data.showSourcesComponent;
      if (data.sourcesData) {
        updates.sourcesData = data.sourcesData;
      }
    }

    this.updateCurrentSession(updates);
  }

  // Actualizar último query del usuario
  updateLastUserQuery(query: string): void {
    this.updateCurrentSession({ lastUserQuery: query });
  }

  // Eliminar sesión
  deleteSession(sessionId: string): void {
    const sessions = this.sessionsSubject.value.filter(
      (s) => s.id !== sessionId
    );
    this.sessionsSubject.next(sessions);

    // Si eliminamos la sesión actual, limpiar
    const current = this.currentSessionSubject.value;
    if (current && current.id === sessionId) {
      this.currentSessionSubject.next(null);
    }

    this.saveToStorage();
  }

  // Renombrar sesión
  renameSession(sessionId: string, newTitle: string): void {
    const sessions = this.sessionsSubject.value;
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex >= 0) {
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        title: newTitle,
        updatedAt: Date.now(),
      };

      this.sessionsSubject.next([...sessions]);

      // Si es la sesión actual, actualizarla también
      const current = this.currentSessionSubject.value;
      if (current && current.id === sessionId) {
        this.currentSessionSubject.next(sessions[sessionIndex]);
      }

      this.saveToStorage();
    }
  }

  // Obtener sesión actual
  getCurrentSession(): ChatSession | null {
    return this.currentSessionSubject.value;
  }

  // Obtener todas las sesiones
  getAllSessions(): ChatSession[] {
    return this.sessionsSubject.value;
  }

  // Limpiar todo el almacenamiento
  clearAllSessions(): void {
    this.sessionsSubject.next([]);
    this.currentSessionSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Generar título automático basado en el primer mensaje del usuario
  generateTitleFromMessage(message: string): string {
    if (message.length <= 30) {
      return message;
    }

    // Extraer palabras clave relevantes
    const keywords = message
      .toLowerCase()
      .match(
        /\b(salario|trabajo|empleo|programador|desarrollador|data|análisis|mercado|laboral)\b/g
      );

    if (keywords && keywords.length > 0) {
      return `${
        keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1)
      } - ${message.substring(0, 20)}...`;
    }

    return `${message.substring(0, 30)}...`;
  }

  // Métodos privados
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: ChatStorage = JSON.parse(stored);
        this.sessionsSubject.next(data.sessions || []);

        // Cargar sesión actual si existe
        if (data.currentSessionId) {
          const currentSession = data.sessions.find(
            (s) => s.id === data.currentSessionId
          );
          if (currentSession) {
            this.currentSessionSubject.next(currentSession);
          }
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions from storage:', error);
      // En caso de error, limpiar el storage corrupto
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private saveToStorage(): void {
    try {
      const sessions = this.sessionsSubject.value;
      const currentSession = this.currentSessionSubject.value;

      const data: ChatStorage = {
        sessions,
        currentSessionId: currentSession?.id || null,
        lastCleanup: Date.now(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat sessions to storage:', error);
    }
  }

  private cleanupOldSessions(): void {
    const sessions = this.sessionsSubject.value;
    const now = Date.now();

    const filteredSessions = sessions.filter((session) => {
      return now - session.updatedAt < this.CLEANUP_INTERVAL;
    });

    if (filteredSessions.length !== sessions.length) {
      this.sessionsSubject.next(filteredSessions);
      this.saveToStorage();
      console.log(
        `Cleaned up ${
          sessions.length - filteredSessions.length
        } old chat sessions`
      );
    }
  }
}
