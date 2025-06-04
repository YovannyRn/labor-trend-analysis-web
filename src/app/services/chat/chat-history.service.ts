import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../auth/token.service';
import { UseStateService } from '../auth/use-state.service';

// Interfaces para el tipado
export interface ChatHistoryEntry {
  id: number;
  user: {
    id: number;
    username: string;
  };
  queryText: string;
  responseText?: string;
  queryType: string;
  responseData?: string;
  sources?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryPage {
  content: ChatHistoryEntry[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ChatStats {
  totalQueries: number;
  recentQueries: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatHistoryService {
  private apiUrl = `${environment.apiUrl}/chat-history`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private useStateService: UseStateService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Obtener historial paginado
   */
  getChatHistory(
    page: number = 0,
    size: number = 20
  ): Observable<ChatHistoryPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ChatHistoryPage>(this.apiUrl, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Buscar en historial
   */
  searchChatHistory(query: string): Observable<ChatHistoryEntry[]> {
    const params = new HttpParams().set('q', query);

    return this.http.get<ChatHistoryEntry[]>(`${this.apiUrl}/search`, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Filtrar por tipo de consulta
   */
  getChatHistoryByType(type: string): Observable<ChatHistoryEntry[]> {
    return this.http.get<ChatHistoryEntry[]>(`${this.apiUrl}/type/${type}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Obtener conversaciones recientes
   */
  getRecentChatHistory(): Observable<ChatHistoryEntry[]> {
    return this.http.get<ChatHistoryEntry[]>(`${this.apiUrl}/recent`, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Crear nueva entrada de chat (normalmente llamado por n8n)
   */
  createChatEntry(
    queryText: string,
    queryType: string
  ): Observable<ChatHistoryEntry> {
    const body = {
      queryText,
      queryType,
    };

    return this.http.post<ChatHistoryEntry>(this.apiUrl, body, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Actualizar respuesta (normalmente llamado por n8n)
   */
  updateChatResponse(
    id: number,
    responseText: string,
    responseData?: string,
    sources?: string
  ): Observable<ChatHistoryEntry> {
    const body = {
      responseText,
      responseData,
      sources,
    };

    return this.http.put<ChatHistoryEntry>(
      `${this.apiUrl}/${id}/response`,
      body,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Eliminar entrada del historial
   */
  deleteChatEntry(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Obtener estadísticas del chat
   */
  getChatStats(): Observable<ChatStats> {
    return this.http.get<ChatStats>(`${this.apiUrl}/stats`, {
      headers: this.getAuthHeaders(),
    });
  }
}
