import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatStorageService } from '../../services/chat/chat-storage.service';
import { ChatSession } from '../../services/interfaces/chat.interface';

@Component({
  selector: 'app-sidebar-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar-chat.component.html',
  styleUrl: './sidebar-chat.component.scss',
})
export class SidebarChatComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Output() sessionSelected = new EventEmitter<ChatSession>();
  @Output() newChatRequested = new EventEmitter<void>();
  @Output() sidebarToggled = new EventEmitter<boolean>();

  sessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  isEditingTitle = false;
  editingSessionId: string | null = null;
  editingTitle = '';

  private subscriptions = new Subscription();
  constructor(private chatStorageService: ChatStorageService) {}
  ngOnInit(): void {
    // Suscribirse a los cambios de sesiones
    this.subscriptions.add(
      this.chatStorageService.sessions$.subscribe((sessions) => {
        this.sessions = sessions;
      })
    );

    // Suscribirse a la sesión actual
    this.subscriptions.add(
      this.chatStorageService.currentSession$.subscribe(
        (session: ChatSession | null) => {
          this.currentSession = session;
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Crear nuevo chat
  createNewChat(): void {
    this.chatStorageService.createNewSession();
    this.newChatRequested.emit();
  }

  // Seleccionar sesión existente
  selectSession(session: ChatSession): void {
    this.chatStorageService.setCurrentSession(session);
    this.sessionSelected.emit(session);
  }
  // Eliminar sesión
  deleteSession(session: ChatSession, event: Event): void {
    event.stopPropagation();

    // Siempre permitir eliminar, pero asegurar que haya al menos una sesión
    this.chatStorageService.deleteSession(session.id);

    // Si se eliminó la sesión actual y hay otras sesiones, seleccionar otra
    if (this.currentSession?.id === session.id) {
      const remainingSessions = this.sessions.filter(
        (s) => s.id !== session.id
      );
      if (remainingSessions.length > 0) {
        this.selectSession(remainingSessions[0]);
      } else {
        // Si no quedan sesiones, crear una nueva
        this.createNewChat();
      }
    }
  }

  // Comenzar edición de título
  startEditingTitle(session: ChatSession, event: Event): void {
    event.stopPropagation();
    this.editingSessionId = session.id;
    this.editingTitle = session.title;
    this.isEditingTitle = true;

    setTimeout(() => {
      const input = document.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  // Guardar título editado
  saveTitle(): void {
    if (this.editingSessionId && this.editingTitle.trim()) {
      this.chatStorageService.renameSession(
        this.editingSessionId,
        this.editingTitle.trim()
      );
    }
    this.cancelEditing();
  }

  cancelEditing(): void {
    this.editingSessionId = null;
    this.editingTitle = '';
    this.isEditingTitle = false;
  }

  onTitleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveTitle();
    } else if (event.key === 'Escape') {
      this.cancelEditing();
    }
  }

  formatLastUpdate(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return new Date(timestamp).toLocaleDateString();
  }

  // Obtener resumen del último mensaje
  getLastMessagePreview(session: ChatSession): string {
    if (!session.messages || session.messages.length === 0) {
      return 'Sin mensajes';
    }

    const lastMessage = session.messages[session.messages.length - 1];
    const text = lastMessage.user || lastMessage.bot || 'Sin contenido';

    return text.length > 60 ? text.substring(0, 57) + '...' : text;
  }

  isSessionActive(session: ChatSession): boolean {
    return this.currentSession?.id === session.id;
  }


  getSessionIcon(session: ChatSession): string {
    if (session.hasGraphics) return 'bi bi-chat-left-fill';
    return 'bi-chat-left-fill';
  }
  clearAllChats(): void {
    if (confirm('¿Estás seguro de que quieres eliminar todos los chats?')) {
      const sessionsToDelete = [...this.sessions];
      sessionsToDelete.forEach((session) => {
        this.chatStorageService.deleteSession(session.id);
      });


      this.createNewChat();
    }
  }

  // Exportar sesión como JSON
  exportSession(session: ChatSession, event: Event): void {
    event.stopPropagation();

    const dataStr = JSON.stringify(session, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_${session.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  // Método para togglear el sidebar
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggled.emit(this.isCollapsed);
  }

  // TrackBy function para optimizar rendering
  trackBySessionId(index: number, session: ChatSession): string {
    return session.id;
  }
}
