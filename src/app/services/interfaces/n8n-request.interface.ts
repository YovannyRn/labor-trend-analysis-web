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
  sources?: string[] | string; 
  fuentes_utilizadas?: string[];
  output?: string; 
  queryId?: number;
  timestamp?: string;
}


export interface ParsedOutputData {
  // Campos básicos de respuesta
  success?: boolean;
  response_type?: 'text' | 'salary_data' | 'sector_growth' | 'sources_info';
  message?: string;

  structured_data?:
    | any
    | {
        // Datos de salario comunes en respuestas de tipo 'salary_data'
        salario_promedio?: number | { [key: string]: any };
        datos_por_region?: { [region: string]: any } | any[];
        habilidades_mejor_pagadas?: { [skill: string]: any } | any[];
        tendencia_salarial?: { [period: string]: any } | any[];

        // Otros posibles campos en structured_data
        fuentes_utilizadas?: string[];
        data?: any; // A veces los datos vienen anidados en un campo 'data'
        labels?: string[] | any[];
        values?: number[] | any[];

        // Campo flexible para otras estructuras
        [key: string]: any;
      };

  // Campos para fuentes
  sources?: string[] | string; // Puede ser array o string (para sources_info)
  fuentes_utilizadas?: string[];

  // Metadatos
  timestamp?: string;
  queryId?: number;
  execution_time?: number;

  // Campo flexible para cualquier otra propiedad
  [key: string]: any;
}
