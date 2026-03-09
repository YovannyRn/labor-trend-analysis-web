# WorkNav — Análisis de Tendencias del Mercado Laboral

Aplicación web de análisis del mercado laboral en España, orientada a proporcionar información actualizada sobre tendencias, salarios y sectores mediante inteligencia artificial.

---

## Descripción General

WorkNav es una plataforma conversacional que permite a los usuarios consultar datos reales del mercado laboral español. El sistema combina inteligencia artificial generativa con fuentes oficiales (INE, SEPE, Ministerio de Trabajo) para ofrecer respuestas contextualizadas en forma de texto, gráficas y listado de fuentes.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND — Angular 17                         │
│         Vercel · labor-trend-analysis-web-ilmv.vercel.app  │
│                                                             │
│  • Autenticación (login/registro)                          │
│  • Chat conversacional con historial                       │
│  • Visualización de gráficas (Chart.js)                    │
│  • Modo claro/oscuro · responsive (móvil/escritorio)       │
└──────────────────────┬──────────────────────────────────────┘
                       │ JWT · HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND — Spring Boot 3                        │
│         Render · backend-tfg-fsbf.onrender.com             │
│                                                             │
│  • API REST (context-path: /api)                           │
│  • Spring Security 6 + JWT                                 │
│  • Gestión de usuarios y sesiones                          │
│  • Proxy seguro hacia n8n                                  │
│  • Historial de chat (CRUD)                                │
└──────────┬─────────────────────────┬────────────────────────┘
           │                         │
           │ HikariCP (max 1 conn)   │ POST /webhook/process-user-request
           ▼                         ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│  MySQL — Filess.io   │  │       n8n — Render               │
│  rennds.h.filess.io  │  │  labor-trend-analysis-web-1      │
│  Base de datos app:  │  │  .onrender.com                   │
│  • users             │  │                                  │
│  • user_queries      │  │  • Workflow de automatización    │
│  • chat_history      │  │  • AI Agent (Gemini + OpenAI)    │
│                      │  │  • 88 herramientas Google Sheets │
│  (max 5 conexiones)  │  │  • Nodos MySQL (Filess.io)       │
└──────────────────────┘  └──────────┬───────────────────────┘
                                     │ PostgreSQL
                                     ▼
                          ┌──────────────────────┐
                          │  Neon PostgreSQL      │
                          │  (BD interna de n8n) │
                          │  ep-sweet-leaf...     │
                          │  eu-west-2.aws.neon   │
                          └──────────────────────┘
```

---

## Stack Tecnológico

### Frontend

| Tecnología      | Versión | Uso               |
| --------------- | ------- | ----------------- |
| Angular         | 17      | Framework SPA     |
| TypeScript      | 5.x     | Lenguaje          |
| SCSS            | —       | Estilos           |
| Chart.js        | —       | Gráficas de datos |
| Bootstrap Icons | —       | Iconografía       |
| Vercel          | —       | Despliegue y CDN  |

### Backend

| Tecnología      | Versión | Uso                          |
| --------------- | ------- | ---------------------------- |
| Spring Boot     | 3.x     | Framework API REST           |
| Spring Security | 6.x     | Autenticación y autorización |
| JWT             | —       | Tokens de sesión             |
| HikariCP        | —       | Pool de conexiones MySQL     |
| Hibernate / JPA | 6.x     | ORM                          |
| Docker          | —       | Contenedorización en Render  |

### Automatización e IA

| Tecnología       | Uso                                                |
| ---------------- | -------------------------------------------------- |
| n8n              | Orquestador principal del workflow de IA           |
| OpenAI (GPT)     | Modelo de lenguaje para respuestas de chat         |
| Google Gemini    | Modelo alternativo / procesamiento                 |
| Google Sheets    | Fuente de datos (INE, SEPE, Ministerio de Trabajo) |
| Google Drive API | Acceso a hojas de cálculo                          |

### Infraestructura

| Servicio        | Uso                                                    |
| --------------- | ------------------------------------------------------ |
| Render (Free)   | Hosting de Spring Boot y n8n                           |
| Vercel (Free)   | Hosting del frontend Angular                           |
| Filess.io       | MySQL compartido (app) — max 5 conexiones              |
| Neon PostgreSQL | BD interna de n8n (gratuito, sin límite de conexiones) |
| UptimeRobot     | Monitoreo y pings anti-sleep cada 5 minutos            |

---

## Flujo de una Consulta

```
1. Usuario escribe consulta en el chat
2. Angular → POST /api/n8n/process (con JWT)
3. Spring Boot valida el token y reenvía a n8n
4. n8n recibe el webhook y determina el tipo de solicitud:
   - "chat"    → respuesta conversacional
   - "graph"   → datos estructurados para gráfica
   - "sources" → listado de fuentes utilizadas
5. n8n invoca el AI Agent (OpenAI/Gemini)
6. El agente consulta Google Sheets con datos oficiales
7. n8n inserta la consulta en MySQL (Filess.io) → tabla user_queries
8. n8n responde al webhook con JSON estructurado
9. Spring Boot devuelve la respuesta al frontend
10. Angular renderiza: texto / gráfica / fuentes según tipo
11. El historial queda guardado y visible en el sidebar
```

---

## Despliegue

### Frontend (Vercel)

- Rama: `yovanny-frondend`
- Despliegue automático en cada push
- URL: `https://labor-trend-analysis-web-ilmv.vercel.app`

### Backend (Render)

- Rama: `master`
- Docker automático
- URL: `https://backend-tfg-fsbf.onrender.com`
- Variables clave: `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`, `JWT_SECRET`, `N8N_URL`, `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=1`

### n8n (Render)

- Rama: `n8n`
- Docker automático
- URL: `https://labor-trend-analysis-web-1.onrender.com`
- BD interna: Neon PostgreSQL (`DB_TYPE=postgresdb`)
- Credenciales configuradas: MySQL (Filess.io), OpenAI, Google Sheets OAuth2

---

## Estructura del Proyecto Frontend

```
src/
├── app/
│   ├── cliente/           # Vistas públicas (login, registro, landing)
│   ├── background/        # Vistas privadas (chat, gráficas, sidebar)
│   │   ├── layout-back/   # Layout principal autenticado
│   │   ├── layout-search/ # Componente de chat y búsqueda
│   │   ├── graficas-multiples/  # Renderizado de gráficas
│   │   ├── sidebar-chat/  # Historial de conversaciones
│   │   └── sources-display/    # Visualización de fuentes
│   └── services/
│       ├── auth/          # Gestión de tokens JWT
│       ├── chat/          # Historial de chat
│       ├── n8n/           # Comunicación con backend/n8n
│       ├── guards/        # authGuard y publicGuard
│       ├── interceptors/  # Inyección automática de JWT
│       ├── interfaces/    # Tipos TypeScript (N8nRequest, N8nResponse)
│       ├── response/      # Validación y procesamiento de respuestas
│       └── utils/         # Utilidades compartidas
└── environments/
    ├── environment.ts           # Producción
    └── environment.development.ts  # Desarrollo local
```

---

## Áreas de Mejora (Roadmap)

### Rendimiento

- [ ] Implementar caché en el backend para consultas repetidas
- [ ] Paginación del historial de chat
- [ ] Lazy loading de módulos Angular

### Funcionalidad

- [ ] Exportar conversaciones a PDF
- [ ] Filtros por fecha y tipo de consulta en el historial
- [ ] Comparativas sectoriales (múltiples sectores simultáneos)
- [ ] Alertas personalizadas de cambios en el mercado laboral
- [ ] Internacionalización (i18n) para otros mercados laborales

### IA y Datos

- [ ] Ampliar fuentes de datos (Eurostat, OCDE)
- [ ] Fine-tuning del modelo con datos específicos del mercado español
- [ ] Memoria conversacional contextual (recordar consultas previas)
- [ ] Análisis predictivo de tendencias a futuro

### Infraestructura

- [ ] Migrar a instancias de pago en Render para eliminar limitaciones de sleep
- [ ] Aumentar pool de conexiones MySQL al superar el límite gratuito de Filess.io
- [ ] CI/CD con tests automatizados antes del despliegue
- [ ] Monitoreo de errores (Sentry)

### Seguridad

- [ ] Proteger endpoint `/api/n8n/process` con JWT obligatorio
- [ ] Rate limiting en endpoints públicos
- [ ] Auditoría de accesos

---

## Variables de Entorno Necesarias

### Backend (Render)

```
MYSQLHOST=rennds.h.filess.io
MYSQLPORT=61031
MYSQLDATABASE=webtfg_chargecost
MYSQLUSER=webtfg_chargecost
MYSQLPASSWORD=***
JWT_SECRET=***
N8N_URL=https://labor-trend-analysis-web-1.onrender.com
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=1
```

### n8n (Render)

```
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=ep-sweet-leaf-....eu-west-2.aws.neon.tech
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=neondb
DB_POSTGRESDB_USER=neondb_owner
DB_POSTGRESDB_PASSWORD=***
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=***
N8N_BASIC_AUTH_PASSWORD=***
N8N_ENCRYPTION_KEY=***
WEBHOOK_URL=https://labor-trend-analysis-web-1.onrender.com
```

---

## Desarrollo Local

```bash
# Frontend
cd labor-trend-analysis-web
npm install
ng serve

# El backend debe estar corriendo en http://localhost:8080
# Ajustar environment.development.ts si es necesario
```

---

## Autor

Proyecto de Fin de Grado (TFG) — Yovanny  
Análisis de tendencias en el mercado laboral mediante IA y automatización

---

## Notas Originales del Proyecto Angular CLI

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
