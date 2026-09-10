# Instrucciones de Integración y Uso del Servidor MCP (Colivi)

Este documento detalla las directrices operativas del servidor MCP (`colivi-mcp-server`) tanto para la configuración del LLM como para los desarrolladores que integran clientes de frontend o asistentes de escritorio.

---

## 1. Directrices de Comportamiento para el LLM (System Prompt)

Cuando un LLM esté conectado a este servidor MCP, debe regirse obligatoriamente por estas 4 directrices:

### 1.1 Regla de Solo Lectura (Read-Only)
* Las herramientas disponibles son estrictamente informativas y analíticas.
* No existen herramientas para mutar base de datos (`INSERT`, `UPDATE`, `DELETE`).
* Si el usuario te pide crear una tarea, borrar un anuncio o expulsar a un miembro, explícale que dichas acciones deben ejecutarse manualmente desde la interfaz de usuario de Colivi.

### 1.2 Delegación de Acciones Humanas (Human-in-the-Loop)
* Si un anfitrión te pide: *"Respóndele a Ana aceptando su solicitud y ofreciéndole una visita"*, redacta el texto del mensaje en lenguaje natural dentro de tu respuesta estándar.
* Indica al usuario: *"Aquí tienes una propuesta de mensaje. Cópialo o revísalo antes de enviarlo desde tu chat"*. No intentes forzar un envío automático.

### 1.3 Seguridad y Contexto Multi-Tenant
* Nunca pidas al usuario su `userId` ni su contraseña. La identidad del usuario activo ya está inyectada en la sesión a través de su token JWT.
* Las herramientas como `get_user_chores_status` no aceptan identificadores; resuelven automáticamente los datos del usuario autenticado.

### 1.4 Manejo de Permisos Administrativos
* La herramienta `get_moderation_queue` está reservada exclusivamente a usuarios con rol `ADMIN`.
* Si un inquilino o propietario solicita auditar denuncias, informa con claridad que no dispone de privilegios de moderación.

---

## 2. Catálogo de Herramientas Registradas

El esquema estático correspondiente se encuentra en [schema.json](file:///c:/Users/vicva/Documents/universidad/Colivi-TFG/mcp-server/schema.json).

| Nombre de la Herramienta | Parámetros | Rol Mínimo | Propósito |
| :--- | :--- | :--- | :--- |
| `search_coliving_listings` | `location` *(string)*, `maxPrice?` *(number)*, `requiredVibe?` *(enum)* | `USER` | Búsqueda cruzada de alojamientos con análisis del ambiente (`TIDY`, `SOCIAL`, `QUIET`). |
| `get_user_chores_status` | `{}` | `USER` | Estado de tareas asignadas al usuario activo y su posición en el ranking semanal del hogar. |
| `summarize_host_inbox` | `listingId?` *(string UUID)* | `USER` (Host) | Resumen de mensajes pendientes y estado de los inquilinos candidatos en las conversaciones. |
| `get_moderation_queue` | `targetType` *("USER" \| "LISTING")* | **`ADMIN`** | Top 10 de entidades con mayor número de reportes pendientes de revisión. |
| `get_my_bookings_status` | `{}` | `USER` | Estado e historial de reservas del inquilino (PENDING, ACCEPTED, etc.) y pago de fianza requerido. |
| `get_listing_details` | `listingId` *(string UUID)* | `USER` | Ficha técnica completa de alojamiento: desglose de fianza, servicios, normas y disponibilidad. |

---

## 3. Protocolo de Conexión del Cliente (SSE Handshake)

### Paso 1: Obtención de Ticket Efímero (Recomendado para evitar JWT en URLs)
```http
POST http://localhost:3001/auth/ticket
Authorization: Bearer eyJhbGciOi...

Respuesta: { "ticket": "e3f8a91b-..." }
```

### Paso 2: Handshake SSE
El cliente abre el canal SSE utilizando el ticket efímero de un solo uso:
```http
GET http://localhost:3001/ticket/e3f8a91b-.../sse
Accept: text/event-stream
```
O directamente mediante cabecera en `/sse`:
```http
GET http://localhost:3001/sse
Authorization: Bearer eyJhbGciOi...
Accept: text/event-stream
```

El servidor responde con un evento `endpoint` indicando la URI protegida para enviar mensajes:
```
event: endpoint
data: /messages?sessionToken=s3cr3t...&sessionId=a1b2c3d4-...
```

### Paso 3: Listar Herramientas (JSON-RPC)
```http
POST http://localhost:3001/messages?sessionId=a1b2c3d4-e5f6-7890-...
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Paso 3: Invocar una Herramienta (JSON-RPC)
```http
POST http://localhost:3001/messages?sessionId=a1b2c3d4-e5f6-7890-...
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_coliving_listings",
    "arguments": {
      "location": "Madrid",
      "maxPrice": 500,
      "requiredVibe": "QUIET"
    }
  }
}
```

La respuesta estructurada llegará a través del canal SSE abierto en el Paso 1.
