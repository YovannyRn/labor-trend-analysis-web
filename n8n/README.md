# Workflow n8n — Análisis de Tendencias del Mercado Laboral

## Requisitos
- n8n v2.10.3 o superior
- Node.js v22+
- MySQL (base de datos `webtfg`)
- Credenciales de Google Sheets
- API Key de OpenAI o Google Gemini

## Cómo importar el workflow

1. Abre n8n en `http://localhost:5678`
2. Ve a **Workflows → Import from file**
3. Selecciona el archivo `workflow.json`
4. Configura las credenciales:
   - **MySQL**: host, usuario, contraseña y base de datos
   - **Google Sheets**: cuenta de Google con acceso a las hojas
   - **OpenAI** o **Google Gemini**: API key

## Webhook de entrada

El workflow escucha en:
```
POST http://localhost:5678/webhook/process-user-request
```

### Body esperado
```json
{
  "userId": 1,
  "userName": "usuario",
  "message": "¿Cuál es la tasa de paro actual?",
  "request_type": "chat"
}
```

### `request_type` válidos
| Valor | Descripción |
|-------|-------------|
| `chat` | Respuesta de texto del agente IA |
| `graph` | Datos estructurados para gráficas |
| `sources` | Fuentes y referencias de los datos |

## Iniciar n8n
```bash
n8n
```
