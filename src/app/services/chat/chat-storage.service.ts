import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ChatSession,
  ChatMessage,
  ChatStorage,
  ChatComponentData,
} from '../interfaces/chat-storage.interface';
import { TokenService } from '../auth/token.service';

@Injectable({
  providedIn: 'root',
})
export class ChatStorageService {
  private readonly STORAGE_KEY_BASE = 'labor_market_chats';
  private readonly MAX_SESSIONS = 50; // Máximo de sesiones guardadas
  private readonly CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 días

  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);
  private sessionsSubject = new BehaviorSubject<ChatSession[]>([]);

  constructor(private tokenService: TokenService) {
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
    const currentUserId = this.tokenService.getUserId();

    if (!currentUserId) {
      throw new Error(
        'Usuario no autenticado. No se puede crear sesión de chat.'
      );
    }

    const session: ChatSession = {
      id: this.generateSessionId(),
      title: title || `Chat ${this.formatDate(now)}`,
      messages: [],
      lastUserQuery: '',
      hasGraphics: false,
      hasSources: false,
      createdAt: now,
      updatedAt: now,
      userId: currentUserId,
    };

    this.setCurrentSession(session);
    return session;
  }
  // Establecer sesión actual
  setCurrentSession(session: ChatSession): void {
    const currentUserId = this.tokenService.getUserId();

    if (!currentUserId) {
      console.error('Usuario no autenticado. No se puede establecer sesión.');
      return;
    }

    // Verificar que la sesión pertenece al usuario actual
    if (session.userId && session.userId !== currentUserId) {
      console.error('Intento de acceso a sesión de otro usuario.');
      return;
    }

    // Si la sesión no tiene userId, asignar el actual (para compatibilidad con sesiones existentes)
    if (!session.userId) {
      session.userId = currentUserId;
    }

    const sessions = this.getUserSessions();
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
    const sessions = this.getUserSessions();
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
    const userSessions = this.getUserSessions();
    const filteredSessions = userSessions.filter((s) => s.id !== sessionId);

    this.updateUserSessions(filteredSessions);

    // Si eliminamos la sesión actual, limpiar
    const current = this.currentSessionSubject.value;
    if (current && current.id === sessionId) {
      this.currentSessionSubject.next(null);
    }

    this.saveToStorage();
  }
  // Renombrar sesión
  renameSession(sessionId: string, newTitle: string): void {
    const userSessions = this.getUserSessions();
    const sessionIndex = userSessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex >= 0) {
      userSessions[sessionIndex] = {
        ...userSessions[sessionIndex],
        title: newTitle,
        updatedAt: Date.now(),
      };

      this.updateUserSessions(userSessions);

      // Si es la sesión actual, actualizarla también
      const current = this.currentSessionSubject.value;
      if (current && current.id === sessionId) {
        this.currentSessionSubject.next(userSessions[sessionIndex]);
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
    return this.getUserSessions();
  }

  // Limpiar todo el almacenamiento del usuario actual
  clearAllSessions(): void {
    this.sessionsSubject.next([]);
    this.currentSessionSubject.next(null);

    const currentUserId = this.tokenService.getUserId();
    if (currentUserId) {
      const storageKey = this.getUserStorageKey(currentUserId);
      localStorage.removeItem(storageKey);
    }
  }
  // Limpiar datos al hacer logout
  clearUserData(): void {
    this.sessionsSubject.next([]);
    this.currentSessionSubject.next(null);
  }

  // Recargar datos para el usuario actual (útil después del login o cambio de usuario)
  reloadUserData(): void {
    this.clearUserData();
    this.loadFromStorage();
    this.cleanupOldSessions();
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

  // Obtener clave de almacenamiento específica del usuario
  private getUserStorageKey(userId: number): string {
    return `${this.STORAGE_KEY_BASE}_user_${userId}`;
  }

  // Obtener sesiones del usuario actual
  private getUserSessions(): ChatSession[] {
    const currentUserId = this.tokenService.getUserId();
    if (!currentUserId) {
      return [];
    }

    return this.sessionsSubject.value.filter(
      (session) => session.userId === currentUserId
    );
  }

  // Actualizar sesiones del usuario actual
  private updateUserSessions(userSessions: ChatSession[]): void {
    const currentUserId = this.tokenService.getUserId();
    if (!currentUserId) {
      return;
    }

    // Mantener sesiones de otros usuarios y actualizar las del usuario actual
    const allSessions = this.sessionsSubject.value;
    const otherUsersSessions = allSessions.filter(
      (session) => session.userId !== currentUserId
    );

    const newAllSessions = [...userSessions, ...otherUsersSessions];
    this.sessionsSubject.next(newAllSessions);
  }
  private loadFromStorage(): void {
    const currentUserId = this.tokenService.getUserId();
    if (!currentUserId) {
      console.log('No hay usuario autenticado, no se cargan sesiones de chat.');
      return;
    }

    try {
      const storageKey = this.getUserStorageKey(currentUserId);
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const data: ChatStorage = JSON.parse(stored);
        // Filtrar solo las sesiones del usuario actual y añadir userId si no lo tienen
        const userSessions = (data.sessions || [])
          .map((session) => ({
            ...session,
            userId: session.userId || currentUserId,
          }))
          .filter((session) => session.userId === currentUserId);

        this.sessionsSubject.next(userSessions);

        // Cargar sesión actual si existe y pertenece al usuario
        if (data.currentSessionId) {
          const currentSession = userSessions.find(
            (s) => s.id === data.currentSessionId
          );
          if (currentSession) {
            this.currentSessionSubject.next(currentSession);
          }
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions from storage:', error);
      // En caso de error, limpiar el storage corrupto del usuario
      const currentUserId = this.tokenService.getUserId();
      if (currentUserId) {
        const storageKey = this.getUserStorageKey(currentUserId);
        localStorage.removeItem(storageKey);
      }
    }
  }
  private saveToStorage(): void {
    const currentUserId = this.tokenService.getUserId();
    if (!currentUserId) {
      console.warn(
        'No hay usuario autenticado, no se pueden guardar las sesiones.'
      );
      return;
    }

    try {
      const userSessions = this.getUserSessions();
      const currentSession = this.currentSessionSubject.value;

      const data: ChatStorage = {
        sessions: userSessions,
        currentSessionId: currentSession?.id || null,
        lastCleanup: Date.now(),
      };

      const storageKey = this.getUserStorageKey(currentUserId);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat sessions to storage:', error);
    }
  }
  private cleanupOldSessions(): void {
    const currentUserId = this.tokenService.getUserId();
    if (!currentUserId) {
      return;
    }

    const userSessions = this.getUserSessions();
    const now = Date.now();

    const filteredSessions = userSessions.filter((session) => {
      return now - session.updatedAt < this.CLEANUP_INTERVAL;
    });

    if (filteredSessions.length !== userSessions.length) {
      this.updateUserSessions(filteredSessions);
      this.saveToStorage();
      console.log(
        `Cleaned up ${
          userSessions.length - filteredSessions.length
        } old chat sessions for user ${currentUserId}`
      );
    }
  }
}
