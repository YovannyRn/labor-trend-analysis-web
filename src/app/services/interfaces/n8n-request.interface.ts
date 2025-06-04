export interface N8nRequest {
  userId: number;
  userName: string;
  message: string;
  request_type?: 'chat' | 'graph' | 'sources';
}

export interface N8nResponse {
  success?: boolean;
  response_type?: 'text' | 'salary_data' | 'sector_growth' | 'sources_info';
  message?: string; 
  structured_data?: any; 
  sources?: string[];
  fuentes_utilizadas?: string[];
  output?: string;
}
