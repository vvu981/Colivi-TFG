# Plan de Desarrollo Maestro — TFG
## Plataforma Integral de Búsqueda de Alojamiento, Gestión de Gastos Compartidos y Auditoría Inteligente mediante MCP

> **Versión:** 1.0.0 · **Autor:** Víctor Vallejo Uroz · **Metodología:** Desarrollo Secuencial por Fases

---

## Tabla de Contenidos

1. [Descripción General de la Plataforma](#1-descripción-general-de-la-plataforma)
2. [Reglas de Negocio y Restricciones](#2-reglas-de-negocio-y-restricciones)
3. [Arquitectura y Stack Tecnológico](#3-arquitectura-y-stack-tecnológico)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Endpoints de la REST API](#5-endpoints-de-la-rest-api)
6. [Especificación del Servidor MCP](#6-especificación-del-servidor-mcp)
7. [Vistas y Componentes del Frontend](#7-vistas-y-componentes-del-frontend)
8. [Infraestructura Docker](#8-infraestructura-docker)
9. [Fases de Desarrollo y Desglose de Tareas](#9-fases-de-desarrollo-y-desglose-de-tareas)

---

## 1. Descripción General de la Plataforma

La plataforma es un sistema web completo que integra tres funcionalidades principales bajo una arquitectura desacoplada de tres capas:

- **Módulo de Alojamiento:** Mercado de anuncios de alquiler con búsqueda geolocalizada, sistema de valoraciones cruzadas (usuario→alojamiento, usuario→usuario), mensajería privada con soporte para ofertas económicas formales y flujo de aprobación administrativa.
- **Módulo de Hogar Compartido:** Gestión privada de convivencia entre usuarios registrados. Incluye registro de gastos con prorrateo configurable, un algoritmo de simplificación de deudas (proyección en memoria sin alteración del historial), y gestión de tareas colectivas del hogar.
- **Módulo de Inteligencia Artificial (MCP):** Capa de extensión que expone los datos internos del sistema a un LLM (mediante API Key de Groq) mediante el Model Context Protocol. Permite auditorías conversacionales, análisis de deudas y búsqueda semántica de alojamientos respetando el aislamiento multi-tenant por JWT.

**Usuarios objetivo:** Universitarios, jóvenes profesionales y propietarios particulares que necesiten gestionar convivencia y búsqueda de alojamiento en una sola plataforma.

---

## 2. Reglas de Negocio y Restricciones

### 2.1 Gestión de Roles y Acceso

| Rol | Permisos |
|-----|----------|
| **Invitado** (no registrado) | Lectura de anuncios, filtros básicos, visualización de mapa |
| **Usuario Registrado** | Todo lo anterior + publicar anuncios (en estado PENDIENTE), valorar, mensajear, crear/unirse a hogares |
| **Administrador** | Todo lo anterior + aprobar/rechazar anuncios, moderar valoraciones y comentarios |

### 2.2 Ciclo de Vida de un Anuncio de Alojamiento

```
[Usuario envía solicitud] → PENDIENTE → [Admin revisa] → ACTIVO | RECHAZADO
                                                                      ↓
                                                                 FINALIZADO
```

- Un anuncio no puede pasar a estado `ACTIVO` si tiene menos de **2 imágenes** asociadas en `ACCOMMODATION_IMAGE`.
- Las imágenes se almacenan en un proveedor cloud (S3 / GCS / Cloudinary); la base de datos persiste únicamente las **URLs absolutas públicas**.

### 2.3 Motor de Gastos Compartidos

- Cada gasto define un **pagador único** y un conjunto de **usuarios afectados**.
- La división por defecto es equitativa. Se permite configurar porcentajes personalizados; la suma de todos los porcentajes debe ser exactamente **100%**.
- El algoritmo de simplificación de deudas opera **exclusivamente en memoria / como vista proyectada**. Nunca modifica, reescribe ni fusiona registros de gastos en la base de datos.
- **Regla de tránsito:** Si A debe 10 € a B y B debe 10 € a C → el sistema proyecta que A debe 10 € directamente a C.
- Un miembro con **deudas pendientes** no puede ser eliminado del hogar.

### 2.4 Inmutabilidad del Subsistema de Auditoría

- La tabla `AUDIT_SNAPSHOT_LOG` es **Append-Only**. Ninguna operación `UPDATE` o `DELETE` está permitida sobre sus registros.
- La inmutabilidad se refuerza a **dos niveles**:
  - Interceptores JPA (`@PreUpdate`, `@PreRemove`) en Spring Boot que lanzan excepción crítica.
  - Trigger a nivel de base de datos PostgreSQL como segunda barrera.
- Cada registro de auditoría captura el estado `snapshot_before` y `snapshot_after` en formato **JSONB**.
- El `server_timestamp` se obtiene exclusivamente del reloj del servidor, nunca del cliente.

### 2.5 Control de Concurrencia Optimista

- Las entidades `HOGAR`, `EXPENSE` y `TASK` implementan un campo `version (INT)` gestionado por la anotación `@Version` de JPA.
- En caso de conflicto concurrente, Spring lanza `OptimisticLockingFailureException`. El cliente secundario debe sincronizar el estado real antes de reintentar.

### 2.6 Seguridad Multi-Tenant en el Servidor MCP

- El servidor MCP no tiene acceso directo a la base de datos.
- El token JWT del usuario se propaga desde el frontend → servidor MCP → API Spring Boot sin modificaciones (**JWT Passthrough**).
- El backend valida en cada llamada que el usuario autenticado pertenece al `hogar_id` solicitado. En caso contrario, retorna `403 Forbidden`.

---

## 3. Arquitectura y Stack Tecnológico

### 3.1 Diagrama de Tres Capas

```
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE PRESENTACIÓN                       │
│                 Next.js 15 + TypeScript                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Páginas SSR │  │ Componentes  │  │  Interfaz Chat   │  │
│  │  (App Router)│  │    React     │  │  (LLM / MCP)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│           │                                    │            │
│    HTTP REST (JWT)                   JSON-RPC + JWT         │
└───────────┼────────────────────────────────────┼────────────┘
            │                                    │
            ▼                                    ▼
┌───────────────────────┐         ┌──────────────────────────┐
│   CAPA DE NEGOCIO     │         │   CAPA IA / MCP          │
│  Java Spring Boot 3.x │◄────────│  Node.js + TypeScript    │
│                       │  HTTP   │                          │
│  • Spring Security    │  REST   │  • Model Context Protocol│
│  • Spring Data JPA    │  + JWT  │  • JSON-RPC sobre SSE    │
│  • BCrypt + JWT       │         │  • JWT Passthrough Auth  │
│  • Lógica de negocio  │         │  • Tools: auditar,       │
│  • Auditoría AOP      │         │    analizar, buscar      │
└───────────┬───────────┘         └──────────────────────────┘
            │
            ▼
┌───────────────────────┐
│   CAPA DE DATOS       │
│   PostgreSQL 16       │
│                       │
│  • Índices B-Tree     │
│  • Tipos JSONB        │
│  • Triggers DDL       │
│  • Constraint checks  │
└───────────────────────┘
```

### 3.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | Next.js (App Router) | 15.x |
| Frontend | React + TypeScript | 18.x / 5.x |
| Frontend | Mapas interactivos | Leaflet.js / Mapbox GL |
| Backend | Java | 21 (LTS) |
| Backend | Spring Boot | 3.x |
| Backend | Spring Security + JWT | 6.x |
| Backend | Spring Data JPA + Hibernate | 6.x |
| Base de Datos | PostgreSQL | 16 |
| Servidor MCP | Node.js + TypeScript | 20 LTS |
| Almacenamiento Objetos | Cloudinary / S3 / GCS | — |
| Contenedores | Docker + Docker Compose | — |
| Build Backend | Maven o Gradle | — |
| Build Frontend | pnpm / npm | — |

---

## 4. Modelo de Datos

### 4.1 Esquema Relacional Completo

```sql
-- ============================================================
-- USUARIOS Y AUTENTICACIÓN
-- ============================================================
CREATE TABLE "user" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name_1     VARCHAR(100) NOT NULL,
    last_name_2     VARCHAR(100),
    phone           VARCHAR(20),
    profile_pic_url TEXT,
    role            VARCHAR(20)  NOT NULL DEFAULT 'USER'  -- 'USER' | 'ADMIN'
);

-- ============================================================
-- MÓDULO DE ALOJAMIENTO
-- ============================================================
CREATE TABLE accommodation (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id         UUID        NOT NULL REFERENCES "user"(id),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    price_per_month  NUMERIC(10,2) NOT NULL,
    address          VARCHAR(255) NOT NULL,
    locality         VARCHAR(100) NOT NULL,
    city             VARCHAR(100) NOT NULL,
    country          VARCHAR(100) NOT NULL,
    latitude         NUMERIC(9,6) NOT NULL,
    longitude        NUMERIC(9,6) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                         -- 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO' | 'FINALIZADO'
);

CREATE TABLE accommodation_image (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accommodation_id UUID NOT NULL REFERENCES accommodation(id) ON DELETE CASCADE,
    image_url        TEXT NOT NULL
);

-- Restricción: mínimo 2 imágenes para activar anuncio (validada en servicio)
-- Índices de búsqueda optimizada
CREATE INDEX idx_accommodation_city_price
    ON accommodation(city, price_per_month);
CREATE INDEX idx_accommodation_lat
    ON accommodation(latitude);
CREATE INDEX idx_accommodation_lon
    ON accommodation(longitude);

CREATE TABLE accommodation_review (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id        UUID NOT NULL REFERENCES "user"(id),
    accommodation_id UUID NOT NULL REFERENCES accommodation(id) ON DELETE CASCADE,
    rating           SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment          TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (author_id, accommodation_id)  -- Un usuario, una review por alojamiento
);

CREATE TABLE user_review (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID NOT NULL REFERENCES "user"(id),
    reviewed_id   UUID NOT NULL REFERENCES "user"(id),
    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (author_id, reviewed_id)
);

CREATE TABLE private_message (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id        UUID NOT NULL REFERENCES "user"(id),
    receiver_id      UUID NOT NULL REFERENCES "user"(id),
    accommodation_id UUID REFERENCES accommodation(id),
    content          TEXT NOT NULL,
    offer_amount     NUMERIC(10,2),          -- NULL si es mensaje de texto plano
    sent_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- MÓDULO DE HOGAR
-- ============================================================
CREATE TABLE hogar (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    admin_id    UUID NOT NULL REFERENCES "user"(id),
    version     INT NOT NULL DEFAULT 0,       -- Bloqueo optimista JPA @Version
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE hogar_member (
    hogar_id UUID NOT NULL REFERENCES hogar(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES "user"(id),
    joined_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (hogar_id, user_id)
);

CREATE TABLE expense (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hogar_id    UUID NOT NULL REFERENCES hogar(id) ON DELETE CASCADE,
    payer_id    UUID NOT NULL REFERENCES "user"(id),
    amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255) NOT NULL,
    version     INT NOT NULL DEFAULT 0,       -- Bloqueo optimista JPA @Version
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE expense_affected (
    expense_id  UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES "user"(id),
    percentage  NUMERIC(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    PRIMARY KEY (expense_id, user_id)
    -- Restricción de negocio: suma de porcentajes = 100 (validada en servicio)
);

CREATE TABLE task (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hogar_id     UUID NOT NULL REFERENCES hogar(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    assigned_to  UUID REFERENCES "user"(id),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    version      INT NOT NULL DEFAULT 0,      -- Bloqueo optimista JPA @Version
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- SUBSISTEMA DE AUDITORÍA (APPEND-ONLY)
-- ============================================================
CREATE TABLE audit_snapshot_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES "user"(id),
    entity_type      VARCHAR(50) NOT NULL,  -- 'EXPENSE' | 'TASK' | 'HOGAR'
    entity_id        UUID NOT NULL,
    action_type      VARCHAR(20) NOT NULL,  -- 'CREATE' | 'UPDATE' | 'DELETE'
    snapshot_before  JSONB,
    snapshot_after   JSONB,
    server_timestamp TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_hogar_entity
    ON audit_snapshot_log(entity_id, entity_type, server_timestamp DESC);

-- Trigger de inmutabilidad (doble barrera junto al interceptor Spring)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_snapshot_log es inmutable: no se permiten UPDATE ni DELETE';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_snapshot_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

### 4.2 Entidades JPA Clave (Resumen)

| Entidad JPA | Tabla | Notas |
|-------------|-------|-------|
| `UserEntity` | `user` | Enum `Role { USER, ADMIN }` |
| `AccommodationEntity` | `accommodation` | Enum `AccommodationStatus` |
| `AccommodationImageEntity` | `accommodation_image` | Colección en `AccommodationEntity` |
| `AccommodationReviewEntity` | `accommodation_review` | |
| `UserReviewEntity` | `user_review` | |
| `PrivateMessageEntity` | `private_message` | `offerAmount` nullable |
| `HogarEntity` | `hogar` | `@Version` en `version` |
| `ExpenseEntity` | `expense` | `@Version` en `version` |
| `ExpenseAffectedEntity` | `expense_affected` | Clave compuesta `@EmbeddedId` |
| `TaskEntity` | `task` | `@Version` en `version` |
| `AuditSnapshotLogEntity` | `audit_snapshot_log` | Solo `save()` permitido |

---

## 5. Endpoints de la REST API

> **Base URL:** `/api/v1`
> **Autenticación:** `Authorization: Bearer <JWT>` en todos los endpoints protegidos.
> **Roles:** `[PUBLIC]` = sin autenticación · `[USER]` = token válido · `[ADMIN]` = rol administrador

### 5.1 Autenticación y Usuarios

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `POST` | `/auth/register` | PUBLIC | Registro de nuevo usuario |
| `POST` | `/auth/login` | PUBLIC | Login → retorna JWT |
| `GET` | `/users/{id}` | USER | Perfil público de un usuario |
| `PUT` | `/users/{id}` | USER | Actualizar perfil propio |
| `GET` | `/users/{id}/reviews` | PUBLIC | Valoraciones recibidas por un usuario |

### 5.2 Alojamientos

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `GET` | `/accommodations` | PUBLIC | Listar anuncios `ACTIVOS` con filtros (`city`, `minPrice`, `maxPrice`, `page`, `size`) |
| `GET` | `/accommodations/{id}` | PUBLIC | Detalle de un anuncio |
| `POST` | `/accommodations` | USER | Crear anuncio (estado inicial `PENDIENTE`) |
| `PUT` | `/accommodations/{id}` | USER | Editar anuncio propio (solo si no está `ACTIVO`) |
| `DELETE` | `/accommodations/{id}` | ADMIN | Eliminar cualquier anuncio |
| `POST` | `/accommodations/{id}/images` | USER | Subir URL de imagen al anuncio |
| `DELETE` | `/accommodations/{id}/images/{imgId}` | USER | Eliminar imagen del anuncio propio |
| `PATCH` | `/accommodations/{id}/status` | ADMIN | Cambiar estado (`ACEPTAR` / `RECHAZAR`) |
| `GET` | `/accommodations/pending` | ADMIN | Listar anuncios pendientes de revisión |
| `GET` | `/accommodations/reviews` | PUBLIC | Valoraciones de alojamientos (con `?city=`) |

### 5.3 Valoraciones

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `POST` | `/accommodations/{id}/reviews` | USER | Crear valoración de alojamiento |
| `DELETE` | `/accommodations/{accommodationId}/reviews/{reviewId}` | ADMIN | Eliminar valoración |
| `POST` | `/users/{id}/reviews` | USER | Crear valoración de usuario |
| `DELETE` | `/users/{userId}/reviews/{reviewId}` | ADMIN | Eliminar valoración de usuario |

### 5.4 Mensajería

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `GET` | `/messages/conversations` | USER | Lista de conversaciones del usuario autenticado |
| `GET` | `/messages/conversations/{userId}` | USER | Hilo de mensajes con un usuario |
| `POST` | `/messages` | USER | Enviar mensaje (texto o con `offerAmount`) |

### 5.5 Hogares

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `POST` | `/hogares` | USER | Crear hogar (el creador se convierte en admin) |
| `GET` | `/hogares/{id}` | USER | Detalle del hogar (solo miembros) |
| `POST` | `/hogares/{id}/invitations` | USER | Invitar miembro por email o nickname |
| `DELETE` | `/hogares/{id}/members/{userId}` | USER | Expulsar miembro (solo si no tiene deudas) |
| `GET` | `/hogares/{id}/balances` | USER | Balances actuales + deudas simplificadas |

### 5.6 Gastos

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `GET` | `/hogares/{hogarId}/expenses` | USER | Listar gastos del hogar |
| `POST` | `/hogares/{hogarId}/expenses` | USER | Registrar nuevo gasto |
| `PUT` | `/hogares/{hogarId}/expenses/{id}` | USER | Editar gasto (pagador o admin del hogar) |
| `DELETE` | `/hogares/{hogarId}/expenses/{id}` | USER | Eliminar gasto |

### 5.7 Tareas

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `GET` | `/hogares/{hogarId}/tasks` | USER | Listar tareas del hogar |
| `POST` | `/hogares/{hogarId}/tasks` | USER | Crear tarea |
| `PUT` | `/hogares/{hogarId}/tasks/{id}` | USER | Editar tarea |
| `PATCH` | `/hogares/{hogarId}/tasks/{id}/toggle` | USER | Conmutar estado `COMPLETADA` / `PENDIENTE` |
| `DELETE` | `/hogares/{hogarId}/tasks/{id}` | USER | Eliminar tarea |

### 5.8 Auditoría

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| `GET` | `/audit/hogar/{hogarId}` | USER | Feed cronológico de cambios del hogar (con `?limit=`) |
| `GET` | `/audit/entity/{entityId}` | USER | Historial de cambios de una entidad específica |

---

## 6. Especificación del Servidor MCP

### 6.1 Arquitectura de Comunicación

```
┌────────────────────────────────────────┐
│         Interfaz de Chat (Next.js)     │
│  Usuario escribe: "¿Cuánto le debo     │
│  a Ana este mes?"                      │
└─────────────────┬──────────────────────┘
                  │  JSON-RPC sobre SSE
                  │  + JWT en metadatos de contexto
                  ▼
┌────────────────────────────────────────┐
│           Servidor MCP                 │
│      (Node.js 20 + TypeScript)         │
│                                        │
│  1. Extrae JWT del contexto MCP        │
│  2. Selecciona tool adecuada           │
│  3. Llama a Spring Boot API            │
│     con Authorization: Bearer <JWT>   │
│  4. Formatea respuesta para el LLM     │
└─────────────────┬──────────────────────┘
                  │  HTTP REST + JWT Passthrough
                  ▼
┌────────────────────────────────────────┐
│          API Spring Boot               │
│  Valida JWT → Verifica membresía       │
│  hogar → Retorna datos o 403           │
└────────────────────────────────────────┘
```

### 6.2 Catálogo de Herramientas (Tools)

#### Tool 1: `auditar_conflictos_hogar`

```typescript
{
  name: "auditar_conflictos_hogar",
  description: "Recupera y analiza la secuencia cronológica de cambios sobre un hogar específico (gastos, tareas, miembros) para resolver malentendidos entre convivientes.",
  inputSchema: {
    type: "object",
    properties: {
      hogarId: {
        type: "string",
        description: "Identificador UUID del hogar a auditar"
      },
      limite: {
        type: "integer",
        description: "Número máximo de registros a analizar (default: 50)",
        default: 50
      }
    },
    required: ["hogarId"]
  }
}
```

**Flujo interno:**
1. Extrae el JWT del contexto de la petición MCP.
2. `GET /api/v1/audit/hogar/{hogarId}?limit={limite}` con `Authorization: Bearer <JWT>`.
3. Itera sobre el array de snapshots y construye un texto estructurado: `[Timestamp] Usuario X [acción] sobre [entidad]: ANTES → {...}, DESPUÉS → {...}`.
4. Retorna el texto formateado al LLM para análisis conversacional.

---

#### Tool 2: `analizar_balances_y_deudas`

```typescript
{
  name: "analizar_balances_y_deudas",
  description: "Extrae el grafo de deudas consolidado del hogar para proveer análisis de optimización de pagos y recomendaciones de liquidación eficiente.",
  inputSchema: {
    type: "object",
    properties: {
      hogarId: {
        type: "string",
        description: "Identificador UUID del hogar"
      }
    },
    required: ["hogarId"]
  }
}
```

**Flujo interno:**
1. Extrae el JWT del contexto MCP.
2. `GET /api/v1/hogares/{hogarId}/balances` con `Authorization: Bearer <JWT>`.
3. Transforma la estructura de balances en lenguaje natural: lista de quién debe a quién y por qué importe, ya optimizada por el algoritmo de tránsito del backend.
4. El LLM emite recomendaciones: *"Para cerrar todas las deudas del mes, Ana debería transferir 35 € a Carlos y 12 € a Luis."*

---

#### Tool 3: `busqueda_semantica_alojamientos`

```typescript
{
  name: "busqueda_semantica_alojamientos",
  description: "Permite buscar alojamientos mediante lenguaje natural cruzando criterios cualitativos (casero amable, zona tranquila, luminoso) con las valoraciones y comentarios del sistema.",
  inputSchema: {
    type: "object",
    properties: {
      criterioSemantico: {
        type: "string",
        description: "Texto libre con preferencias: 'piso luminoso cerca de la universidad, propietario responsivo'"
      },
      ciudad: {
        type: "string",
        description: "Ciudad base para filtrar los alojamientos"
      }
    },
    required: ["criterioSemantico", "ciudad"]
  }
}
```

**Flujo interno:**
1. Extrae el JWT del contexto MCP.
2. `GET /api/v1/accommodations/reviews?city={ciudad}` con `Authorization: Bearer <JWT>`.
3. Concatena descripciones y comentarios de valoraciones en un corpus de texto.
4. El LLM actúa como filtro semántico sobre el corpus, identificando qué alojamientos o propietarios mejor se ajustan al `criterioSemantico`.
5. Retorna una lista priorizada con justificación cualitativa.

### 6.3 Protocolo de Seguridad Multi-Tenant

```typescript
// Ejemplo de extracción y propagación del JWT en el servidor MCP
server.setRequestHandler(CallToolRequestSchema, async (request, context) => {
  // 1. Extraer JWT de los metadatos de contexto inyectados por el frontend
  const jwt = context?.meta?.authorization?.replace("Bearer ", "");
  if (!jwt) throw new McpError(ErrorCode.InvalidRequest, "Token JWT requerido");

  // 2. Propagar en todas las llamadas al backend
  const response = await fetch(`${SPRING_API_BASE}${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  });

  // 3. Gestionar respuestas de autorización denegada
  if (response.status === 403) {
    throw new McpError(ErrorCode.InvalidRequest, "Acceso denegado: no eres miembro de este hogar");
  }

  return await response.json();
});
```

---

## 7. Vistas y Componentes del Frontend

### 7.1 Mapa de Rutas (Next.js App Router)

```
app/
├── (public)/
│   ├── page.tsx                  → Home: listado + mapa de alojamientos
│   ├── accommodations/
│   │   ├── page.tsx              → Búsqueda con filtros
│   │   └── [id]/
│   │       └── page.tsx          → Detalle de alojamiento
│   └── users/
│       └── [id]/
│           └── page.tsx          → Perfil público de usuario
│
├── (auth)/
│   ├── login/page.tsx            → Formulario de login
│   └── register/page.tsx         → Formulario de registro
│
├── (dashboard)/                  → Layout protegido (requiere JWT)
│   ├── layout.tsx                → Sidebar + NavBar autenticada
│   ├── dashboard/page.tsx        → Panel principal del usuario
│   ├── accommodations/
│   │   └── new/page.tsx          → Formulario de nuevo anuncio
│   ├── messages/
│   │   ├── page.tsx              → Lista de conversaciones
│   │   └── [userId]/page.tsx     → Hilo de mensajes
│   ├── hogar/
│   │   ├── page.tsx              → Vista del hogar: balances, tareas
│   │   ├── expenses/
│   │   │   ├── page.tsx          → Lista de gastos
│   │   │   └── new/page.tsx      → Formulario de nuevo gasto
│   │   ├── tasks/page.tsx        → Gestión de tareas
│   │   └── activity/page.tsx     → Feed de auditoría cronológica
│   └── chat/page.tsx             → Interfaz de chat con LLM (MCP)
│
└── (admin)/                      → Layout solo ADMIN
    ├── layout.tsx
    └── admin/
        ├── pending/page.tsx      → Anuncios pendientes de aprobación
        └── moderation/page.tsx   → Moderación de reviews y comentarios
```

### 7.2 Componentes Reutilizables Clave

| Componente | Descripción |
|------------|-------------|
| `<AccommodationCard />` | Tarjeta de anuncio con imagen, precio, ciudad y rating |
| `<AccommodationMap />` | Mapa Leaflet/Mapbox con marcadores geolocalizados filtrados |
| `<FilterBar />` | Barra de filtros: ciudad, rango de precios |
| `<StarRating />` | Componente de valoración de 1-5 estrellas |
| `<BalanceIndicator />` | Círculo verde/rojo con importe de balance del usuario |
| `<DebtGraph />` | Visualización del grafo simplificado de deudas |
| `<ExpenseForm />` | Formulario de gasto con selector de afectados y porcentajes |
| `<TaskCard />` | Tarjeta de tarea con toggle de estado completada/pendiente |
| `<AuditFeedItem />` | Ítem del feed de actividad con diff antes/después en lenguaje natural |
| `<ChatInterface />` | Interfaz de chat conectada al LLM vía servidor MCP |
| `<ImageUploader />` | Subida de imágenes a la nube con previsualización |
| `<MessageThread />` | Hilo de mensajes privados con soporte para ofertas económicas |
| `<ProtectedRoute />` | HOC / layout que redirige a /login si no hay JWT válido |

### 7.3 Gestión de Estado y Peticiones

- **Autenticación:** JWT almacenado en `httpOnly cookie` o `localStorage` según política CORS. Contexto global con React Context / Zustand.
- **Peticiones API:** `fetch` nativo o `axios` con interceptor que inyecta el JWT automáticamente en cada cabecera.
- **Mapa:** Carga dinámica con `next/dynamic` y `{ ssr: false }` para evitar errores de hidratación con Leaflet.
- **Formularios:** React Hook Form + Zod para validación en cliente.

---

## 8. Infraestructura Docker

### 8.1 `docker-compose.yml` Sugerido

```yaml
version: "3.9"

services:

  # ──────────────────────────────────────────────
  # BASE DE DATOS
  # ──────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: tfg_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: tfg_db
      POSTGRES_USER: tfg_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tfg_user -d tfg_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ──────────────────────────────────────────────
  # BACKEND — Java Spring Boot
  # ──────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tfg_backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/tfg_db
      SPRING_DATASOURCE_USERNAME: tfg_user
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION_MS: 86400000
      CLOUD_STORAGE_URL: ${CLOUD_STORAGE_URL}
      CLOUD_STORAGE_API_KEY: ${CLOUD_STORAGE_API_KEY}
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ──────────────────────────────────────────────
  # SERVIDOR MCP — Node.js / TypeScript
  # ──────────────────────────────────────────────
  mcp-server:
    build:
      context: ./mcp-server
      dockerfile: Dockerfile
    container_name: tfg_mcp
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    environment:
      SPRING_API_BASE_URL: http://backend:8080/api/v1
      MCP_PORT: 3001
    ports:
      - "3001:3001"

  # ──────────────────────────────────────────────
  # FRONTEND — Next.js
  # ──────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: tfg_frontend
    restart: unless-stopped
    depends_on:
      - backend
      - mcp-server
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080/api/v1
      NEXT_PUBLIC_MCP_URL: http://mcp-server:3001
      NEXT_PUBLIC_MAP_TOKEN: ${MAP_TOKEN}
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### 8.2 Dockerfiles de Referencia

**Backend (`backend/Dockerfile`):**
```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**MCP Server (`mcp-server/Dockerfile`):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**Frontend (`frontend/Dockerfile`):**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### 8.3 Variables de Entorno (`.env`)

```env
POSTGRES_PASSWORD=SuperSecretPassword123!
JWT_SECRET=your-256-bit-secret-key-here
CLOUD_STORAGE_URL=https://api.cloudinary.com/v1_1/your-cloud
CLOUD_STORAGE_API_KEY=your-cloudinary-api-key
MAP_TOKEN=your-mapbox-or-leaflet-token
```

---

## 9. Fases de Desarrollo y Desglose de Tareas

> **Metodología:** Desarrollo secuencial por un único desarrollador. Cada fase debe completarse y pasar sus pruebas antes de iniciar la siguiente. Las estimaciones son orientativas.

---

### Fase 1 — Infraestructura Base y Seguridad
**Duración estimada: 1-2 semanas**

**Objetivo:** Tener el proyecto configurado, la base de datos funcionando y la autenticación completamente operativa.

#### 1.1 Configuración del Proyecto Backend
- [ ] Inicializar proyecto Spring Boot 3.x con Java 21 (via Spring Initializr).
- [ ] Agregar dependencias: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `postgresql`, `jjwt`.
- [ ] Configurar `application.yml` con perfiles `dev` y `prod` (datasource, JPA DDL, logging).
- [ ] Estructurar paquetes según arquitectura limpia: `config`, `features/{user,accommodation,hogar,audit}`, `shared`.

#### 1.2 Esquema de Base de Datos
- [ ] Crear todas las entidades JPA (`@Entity`, `@Table`, relaciones `@ManyToOne`, `@OneToMany`, `@ManyToMany`).
- [ ] Añadir `@Version` a `HogarEntity`, `ExpenseEntity`, `TaskEntity`.
- [ ] Configurar Hibernate para generación de esquema en dev (`ddl-auto: create`).
- [ ] Crear script `init.sql` con índices compuestos, índices B-Tree sobre `latitude`/`longitude` y trigger de inmutabilidad para `audit_snapshot_log`.
- [ ] Verificar la creación correcta del esquema en PostgreSQL local / Docker.

#### 1.3 Módulo de Seguridad JWT
- [ ] Diseñar interfaz `JwtTokenProvider` y su implementación.
- [ ] Implementar `JwtAuthenticationFilter` (extends `OncePerRequestFilter`).
- [ ] Configurar `SecurityFilterChain`: rutas públicas vs. protegidas, CORS.
- [ ] Implementar `UserDetailsServiceImpl` que carga usuarios desde repositorio.

#### 1.4 Autenticación de Usuarios (SRP aplicado)
- [ ] Diseñar interfaz `UserService` con métodos `register`, `login`, `findById`.
- [ ] Implementar `UserServiceImpl` (lógica de negocio, cifrado BCrypt, generación de JWT).
- [ ] Crear `UserController`: `POST /auth/register`, `POST /auth/login`.
- [ ] Crear `UserRepository extends JpaRepository<UserEntity, UUID>`.
- [ ] Definir DTOs: `RegisterRequestDto`, `LoginRequestDto`, `AuthResponseDto`, `UserProfileDto`.
- [ ] Pruebas unitarias de `UserServiceImpl` con Mockito.

#### 1.5 Configuración del Proyecto Frontend
- [ ] Inicializar proyecto Next.js 15 con TypeScript, Tailwind CSS y App Router.
- [ ] Configurar cliente HTTP (axios o fetch) con interceptor de JWT.
- [ ] Implementar páginas `/login` y `/register` con React Hook Form + Zod.
- [ ] Implementar contexto de autenticación global (almacenamiento de JWT, estado del usuario).
- [ ] Implementar layout protegido `(dashboard)/layout.tsx`.

---

### Fase 2 — Backend Core: Hogar y Motor Financiero
**Duración estimada: 2 semanas**

**Objetivo:** Módulo de hogar completamente funcional con gestión de gastos, deudas simplificadas y tareas.

#### 2.1 Módulo de Hogar (SOLID estricto)
- [ ] Diseñar interfaz `HogarService` (ISP: métodos separados por responsabilidad).
- [ ] Implementar `HogarServiceImpl`: crear hogar, invitar miembro (por email/nickname), expulsar miembro (con validación de deudas), listar miembros.
- [ ] Crear `HogarController` con endpoints CRUD del hogar.
- [ ] Crear `HogarRepository`, `HogarMemberRepository`.

#### 2.2 Motor de Gastos
- [ ] Diseñar interfaz `ExpenseService`.
- [ ] Implementar `ExpenseServiceImpl`: registrar gasto con pagador y afectados, validar suma de porcentajes = 100%, editar, eliminar.
- [ ] Crear `ExpenseController`, `ExpenseRepository`, `ExpenseAffectedRepository`.
- [ ] DTOs con validaciones (`@NotNull`, `@Positive`, `@Size`).

#### 2.3 Algoritmo de Simplificación de Deudas (OCP aplicado)
- [ ] Diseñar interfaz `DebtSimplifierEngine` con método `simplify(List<Balance> balances): List<DebtTransfer>`.
- [ ] Implementar `TransitDebtSimplifier implements DebtSimplifierEngine`:
  - Calcular saldo neto por usuario (Σ pagado − Σ adeudado).
  - Aplicar algoritmo greedy de compensación directa (acreedores vs deudores).
  - Retornar lista de transferencias optimizadas `{from, to, amount}`.
- [ ] El servicio de balances consume la interfaz `DebtSimplifierEngine` vía DIP (inyección por constructor).
- [ ] **No se modifica ningún registro de BD:** el resultado es exclusivamente una proyección en memoria.
- [ ] Endpoint `GET /hogares/{id}/balances` retorna: balances por usuario (verde/rojo) + lista de transferencias sugeridas.
- [ ] Pruebas unitarias exhaustivas del algoritmo con casos extremos (deudas circulares, un solo deudor, balances cero).

#### 2.4 Módulo de Tareas
- [ ] Diseñar interfaz `TaskService` y `TaskServiceImpl`.
- [ ] Operaciones: crear tarea, editar, eliminar, conmutar estado `COMPLETADA`/`PENDIENTE`.
- [ ] Verificar que el `@Version` en `TaskEntity` dispara `OptimisticLockingFailureException` ante concurrencia.
- [ ] Controlador de excepciones global (`@ControllerAdvice`) que retorna `409 Conflict` ante `OptimisticLockingFailureException`.

---

### Fase 3 — Subsistema de Auditoría Inmutable
**Duración estimada: 1 semana**

**Objetivo:** Captura automática de snapshots, inmutabilidad garantizada y feed de actividad.

#### 3.1 Mecanismo de Captura de Snapshots
- [ ] Implementar `AuditInterceptor` mediante **Spring AOP** (`@Aspect`, `@Around`) que intercepta los métodos de `ExpenseService` y `TaskService`.
- [ ] Alternativa con JPA Entity Listeners (`@EntityListeners`) en `ExpenseEntity` y `TaskEntity` para eventos `@PreUpdate`, `@PreRemove`.
- [ ] Serializar el estado antes/después de cada operación a JSONB usando `ObjectMapper`.
- [ ] Extraer `userId` del `SecurityContextHolder` para la trazabilidad de autoría.
- [ ] Inyectar timestamp desde `Clock.systemUTC()` (bean de Spring) para impedir manipulación del cliente.

#### 3.2 Servicio de Auditoría (ISP aplicado)
- [ ] Diseñar interfaz `AuditLogRepository extends JpaRepository` con **solo** métodos de lectura y `save()`. Eliminar explícitamente `deleteById` y `deleteAll` del contrato.
- [ ] Implementar `AuditLogServiceImpl` que invoca únicamente `auditLogRepository.save(snapshot)`.
- [ ] Añadir `@PreUpdate` y `@PreRemove` en `AuditSnapshotLogEntity` que lancen `UnsupportedOperationException`.
- [ ] Verificar que el trigger DDL de PostgreSQL bloquea `UPDATE`/`DELETE` como segunda barrera.

#### 3.3 Feed de Actividad
- [ ] Endpoint `GET /audit/hogar/{hogarId}?limit=50` que retorna la lista de snapshots ordenados por `server_timestamp DESC`.
- [ ] Servicio de transformación: convierte JSONB de snapshots a texto legible en español (ej: *"Carlos modificó el gasto 'Supermercado' de 45 € a 52 €"*).
- [ ] Pruebas de integración: crear gasto → modificar → verificar que hay 2 entradas en `audit_snapshot_log`.

---

### Fase 4 — Módulo de Alojamiento y Mapa
**Duración estimada: 2 semanas**

**Objetivo:** Mercado de anuncios completamente funcional con búsqueda geolocalizada, valoraciones y mensajería.

#### 4.1 CRUD de Alojamientos y Aprobaciones
- [ ] Diseñar interfaz `AccommodationService` y `AccommodationServiceImpl`.
- [ ] Endpoint `POST /accommodations`: crea anuncio en estado `PENDIENTE`.
- [ ] Endpoint `PATCH /accommodations/{id}/status`: solo ADMIN puede activar/rechazar. Validar ≥ 2 imágenes antes de activar.
- [ ] Integración con proveedor de almacenamiento cloud: `POST /accommodations/{id}/images` recibe URL verificada y la persiste en `accommodation_image`.
- [ ] Endpoint `GET /accommodations/pending` para el panel de administración.

#### 4.2 Búsqueda y Filtrado
- [ ] Query JPA con `Specification` o JPQL dinámica para filtros: `city`, `minPrice`, `maxPrice`, `status = ACTIVO`.
- [ ] Endpoint paginado `GET /accommodations?page=0&size=12`.
- [ ] Endpoint con filtro geográfico por bounding box (lat/lon min-max) usando los índices B-Tree.

#### 4.3 Sistema de Valoraciones
- [ ] `AccommodationReviewService` + `UserReviewService` (dos servicios separados: SRP).
- [ ] Validar que un usuario no pueda valorarse a sí mismo.
- [ ] Validar unicidad de valoración (un usuario → un anuncio: constraint `UNIQUE`).
- [ ] Endpoints de moderación para ADMIN.

#### 4.4 Mensajería Privada
- [ ] `PrivateMessageService` + `PrivateMessageController`.
- [ ] Soporte para `offerAmount` opcional (oferta económica formal).
- [ ] Listar conversaciones agrupadas por interlocutor.

#### 4.5 Frontend — Módulo de Alojamiento
- [ ] Página Home (`/`): grid de `AccommodationCard` + `AccommodationMap` con marcadores Leaflet (carga dinámica SSR=false).
- [ ] Página de detalle (`/accommodations/[id]`): galería de imágenes, descripción, mapa centrado, valoraciones, botón de mensaje.
- [ ] Formulario de nuevo anuncio con `ImageUploader` y validación de mínimo 2 imágenes.
- [ ] Panel de administración: lista de pendientes con botones Aprobar/Rechazar.

---

### Fase 5 — Frontend — Módulo de Hogar
**Duración estimada: 1 semana**

**Objetivo:** Interfaz completa para gestión de convivencia, gastos y auditoría.

- [ ] Página del hogar (`/hogar`): lista de miembros con `BalanceIndicator` (verde/rojo), resumen de deudas simplificadas.
- [ ] Componente `DebtGraph`: visualización de quién debe pagar a quién según el algoritmo de tránsito.
- [ ] Página de gastos (`/hogar/expenses`): lista cronológica, formulario de nuevo gasto con `ExpenseForm` (selector de afectados + inputs de porcentaje con validación de suma = 100%).
- [ ] Página de tareas (`/hogar/tasks`): lista de `TaskCard` con toggle de estado (optimistic UI update).
- [ ] Página del feed de actividad (`/hogar/activity`): lista de `AuditFeedItem` con diff visual antes/después.
- [ ] Flujo de invitación de miembros mediante modal.

---

### Fase 6 — Servidor MCP y Chat IA
**Duración estimada: 1 semana**

**Objetivo:** Servidor MCP completamente operativo con las tres herramientas e integrado en el frontend.

#### 6.1 Servidor MCP (Node.js + TypeScript)
- [ ] Inicializar proyecto Node.js 20 con TypeScript, compilación `tsc`.
- [ ] Instalar SDK oficial MCP (`@modelcontextprotocol/sdk`).
- [ ] Implementar servidor con transporte SSE o stdio según entorno.
- [ ] Registrar las tres tools: `auditar_conflictos_hogar`, `analizar_balances_y_deudas`, `busqueda_semantica_alojamientos`.
- [ ] Implementar lógica de extracción del JWT del contexto de la petición JSON-RPC.
- [ ] Implementar cliente HTTP hacia Spring Boot con propagación del JWT (passthrough).
- [ ] Gestionar respuestas `403` del backend retornando `McpError` apropiado.
- [ ] Pruebas de integración: simular petición MCP con JWT válido/inválido.

#### 6.2 Frontend — Interfaz de Chat
- [ ] Página `/chat` con componente `ChatInterface`.
- [ ] Conexión al servidor MCP vía SSE o WebSocket con inyección del JWT en metadatos de contexto.
- [ ] Historial de mensajes con diferenciación visual usuario / asistente.
- [ ] Indicador de "tool en uso" mientras el LLM llama a una herramienta MCP.
- [ ] Manejo de errores: token expirado, acceso denegado.

---

### Fase 7 — Integración, Pruebas y Pulido Final
**Duración estimada: 1 semana**

**Objetivo:** Sistema completamente integrado, testeado y listo para presentación.

#### 7.1 Pruebas de Integración Backend
- [ ] Tests de integración con `@SpringBootTest` + `TestContainers` (PostgreSQL real).
- [ ] Test del ciclo completo de auditoría: crear → modificar → verificar inmutabilidad.
- [ ] Test de concurrencia optimista: dos hilos modificando el mismo `ExpenseEntity` simultáneamente.
- [ ] Test del algoritmo de simplificación de deudas con escenario de tránsito (A→B→C = A→C).
- [ ] Verificar que el trigger DDL bloquea efectivamente `UPDATE`/`DELETE` en `audit_snapshot_log`.

#### 7.2 Configuración Docker Compose
- [ ] Completar `docker-compose.yml` con todos los servicios.
- [ ] Crear archivo `.env.example` con todas las variables necesarias.
- [ ] Verificar arranque completo con `docker compose up --build`.
- [ ] Comprobar healthchecks y orden de arranque con `depends_on`.

#### 7.3 Seguridad y Hardening
- [ ] Revisar que todos los endpoints sensibles exigen JWT.
- [ ] Auditar que ningún endpoint del módulo de hogar retorna datos si el usuario no es miembro.
- [ ] Configurar CORS de Spring Boot para aceptar solo el origen del frontend.
- [ ] Revisar headers de seguridad en Next.js (`next.config.js`).

#### 7.4 Documentación
- [ ] Generar documentación de la API REST con **Springdoc OpenAPI** (Swagger UI en `/swagger-ui.html`).
- [ ] Documentar en `README.md`: instrucciones de arranque con Docker, variables de entorno, arquitectura.
- [ ] Comentar las interfaces y clases clave de Spring Boot con Javadoc.

---

## Resumen de Fases

| Fase | Nombre | Duración Est. | Entregable Principal |
|------|--------|--------------|---------------------|
| 1 | Infraestructura Base y Seguridad | 1-2 semanas | Autenticación JWT + DB funcionando |
| 2 | Backend Core: Hogar y Motor Financiero | 2 semanas | API de hogares, gastos y deudas |
| 3 | Subsistema de Auditoría Inmutable | 1 semana | Captura de snapshots + feed de actividad |
| 4 | Módulo de Alojamiento y Mapa | 2 semanas | Mercado de anuncios con mapa y valoraciones |
| 5 | Frontend — Módulo de Hogar | 1 semana | UI completa de gestión de convivencia |
| 6 | Servidor MCP y Chat IA | 1 semana | Servidor MCP con 3 tools + chat integrado |
| 7 | Integración, Pruebas y Pulido Final | 1 semana | Sistema completo, testeado y dockerizado |
| | **Total estimado** | **9-10 semanas** | |

---

*Documento generado como Plan de Desarrollo Maestro para TFG. Actualizar el estado de las tareas (`[ ]` → `[x]`) conforme avance el desarrollo.*