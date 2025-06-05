export interface ChatMessage {
  user?: string;
  bot?: string;
  timestamp: number;
}

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
  userId?: number; 
}

export interface ChatStorage {
  sessions: ChatSession[];
  currentSessionId: string | null;
  lastCleanup: number;
}

export interface ChatComponentData {
  showMultipleGraphsComponent: boolean;
  multipleGraphsData: any;
  showSourcesComponent: boolean;
  sourcesData: any;
}
