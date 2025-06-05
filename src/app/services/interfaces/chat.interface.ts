export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUserQuery: string;
  hasGraphics: boolean;
  hasSources: boolean;
  graphicsData?: any;
  sourcesData?: any;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  user?: string;
  bot?: string;
  timestamp: number;
}

export enum MessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export interface ComponentData {
  graphs?: any;
  sources?: any;
}
