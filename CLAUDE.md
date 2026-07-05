# Plan de Desarrollo Maestro — TFG
## Plataforma Integral de Búsqueda de Alojamiento, Gestión de Gastos Compartidos y Auditoría Inteligente mediante MCP

> **Víctor Vallejo Uroz · Arquitectura desacoplada · Java 21 + Spring Boot 3.x + Next.js 15 + Servidor MCP**

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

La plataforma es un sistema web full-stack de tres capas independientes que cubre dos grandes necesidades:

### 1.1 Módulo de Alojamiento (Físico y Comercial)

El marketplace de alquiler residencial se divide en dos submódulos bien diferenciados por rol (Invitado, Usuario Registrado, Administrador) para garantizar alta cohesión y bajo acoplamiento:
- **Estructura Física (Accommodation)**: Representa la propiedad física inmutable asociada a su propietario. Contiene dirección, ciudad, provincia, país, habitaciones totales/libres, baños, metros cuadrados, coordenadas (latitud/longitud), "amenities" estructurales (Set de `AmenityType`) y la gestión de imágenes físicas integradas en la nube con Cloudinary. Su ciclo de vida depende del propietario.
- **Publicación Comercial (AccommodationListing)**: Representa el anuncio, la oferta o publicación en el catálogo para alquilar. Depende de un `Accommodation` (relación 1:N o 1:1, un alojamiento físico puede poseer históricos de anuncios). Contiene el precio mensual, fechas de disponibilidad, reglas de convivencia (house_rules), fianza y el estado de visibilidad comercial (`AVAILABLE`, `PAUSED`, `RENTED`).

### 1.2 Módulo de Hogar (Gestión Privada de Convivencia)

Espacio privado multi-tenant para grupos de convivencia. Permite registrar gastos compartidos con prorrateo flexible, visualizar balances en tiempo real con un algoritmo de simplificación de deudas (tránsito virtual sin reescritura de BD), gestionar tareas colectivas y auditar de forma inmutable cada cambio financiero u organizativo mediante snapshots JSONB.

### 1.3 Capa de Inteligencia Artificial (Servidor MCP)

Servidor independiente que implementa el Model Context Protocol (MCP) y actúa como puente seguro entre un LLM (Claude, GPT, etc.) y la API REST del backend. Expone herramientas estructuradas (JSON-RPC) para auditoría conversacional, análisis de deudas y búsqueda semántica de alojamientos, con aislamiento multi-tenant garantizado por propagación de JWT.

---

## 2. Reglas de Negocio y Restricciones

### 2.1 Gestión de Alojamientos y Anuncios Comerciales

| Regla | Detalle |
|---|---|
| **Mínimo de imágenes** | Un anuncio comercial (`AccommodationListing`) no puede pasar a estado de visibilidad activa (`AVAILABLE` y moderación `APPROVED`) si la propiedad física (`Accommodation`) asociada tiene menos de 2 imágenes registradas en Cloudinary. Validación en `AccommodationListingService` y a nivel de base de datos. |
| **Ciclo de vida del anuncio** | Moderación: `PENDIENTE → APROBADO` · `PENDIENTE → RECHAZADO`. Visibilidad Comercial (tras aprobación): `AVAILABLE` (disponible y visible en catálogo) · `PAUSED` (pausado temporalmente por el host) · `RENTED` (alquilado). |
| **Almacenamiento de imágenes** | Asociadas al alojamiento físico (`Accommodation`). Las imágenes se suben a Cloudinary. El backend persiste únicamente las URLs absolutas públicas de las imágenes físicas. Nunca se almacenan binarios en el servidor Spring Boot. |
| **Moderación manual** | Un Administrador puede eliminar cualquier alojamiento físico o anuncio comercial, comentario o valoración. Solo un Administrador puede aprobar o rechazar solicitudes de publicación en estado `PENDIENTE`. |
| **Auto-moderación preventiva** | Si un anuncio comercial (`AccommodationListing`) acumula más de **5 denuncias únicas** en estado `PENDING` (en tabla `ACCOMMODATION_REPORT`), el sistema cambia automáticamente su estado de moderación a `PENDIENTE`, retira su visibilidad comercial del catálogo y genera una alerta prioritaria en la bandeja del Administrador. Acción atómica y gestionada por `AccommodationReportService`. |
| **Denuncias de anuncios** | Cualquier usuario (registrado o anónimo) puede enviar una denuncia contra un anuncio comercial vía `POST /api/v1/listings/{id}/reports`. Los motivos posibles son: `SPAM`, `SCAM`, `INAPPROPRIATE`, `MISLEADING`. El estado de la denuncia sigue el ciclo: `PENDING → REVIEWED → DISMISSED`. |
| **Listado dinámico y catálogo** | Unificación en `getListingsCatalog(owner, visibility, page, size)` con estados de visibilidad (`AVAILABLE`, `PAUSED`, `RENTED`) e histórico para evitar duplicidad de consultas JPA y optimizar filtrados. |
| **Listado dinámico y catálogo** | Unificación en `getAccommodationsCatalog(owner, visibility, page, size)` con estados `AVAILABLE` (activos), `DELETED` (borrado lógico) y `ALL` (todo el histórico) para evitar duplicidad de consultas JPA y optimizar filtrados. |

### 2.2 Motor de Gastos Compartidos

| Regla | Detalle |
|---|---|
| **Pagador único** | Cada gasto tiene exactamente un usuario pagador (`payer_id`). |
| **Afectados y prorrateo** | El conjunto de usuarios afectados puede ser un subconjunto del hogar. La distribución es equitativa por defecto; se admite porcentaje personalizado siempre que la suma sea 100 %. |
| **Algoritmo de simplificación** | El grafo de tránsito de deudas se calcula en memoria (on-the-fly o caché temporal). **Nunca modifica, reescribe ni fusiona registros de `EXPENSE` en base de datos.** |
| **Eliminación de miembros** | El administrador del Hogar solo puede eliminar a un miembro si su balance neto es cero (sin deudas pendientes). |
| **Porcentajes** | Los porcentajes de los afectados deben sumar exactamente el 100 %. Validación en `ExpenseService` antes de persistir. |

### 2.3 Trazabilidad e Inmutabilidad de Auditoría

| Regla | Detalle |
|---|---|
| **Append-Only** | La tabla `AUDIT_SNAPSHOT_LOG` es de solo escritura. Ningún `UPDATE` ni `DELETE` sobre ella puede prosperar. Bloqueado mediante trigger de PostgreSQL + interceptores `@PreUpdate` / `@PreRemove` en Spring Data JPA. |
| **Timestamp de servidor** | La marca de tiempo de cada snapshot es inyectada por el servidor en el momento de la escritura. El cliente nunca puede manipularla. |
| **Snapshot Before / After** | Cualquier operación de creación, modificación o eliminación sobre `EXPENSE` o `TASK` genera un registro con el estado previo y posterior en formato JSONB. |
| **Control de concurrencia optimista** | Las entidades `HOGAR`, `EXPENSE` y `TASK` llevan campo `version (INT)` gestionado por `@Version` de JPA. En conflicto, la segunda transacción lanza `OptimisticLockingFailureException` y se rechaza. |

### 2.4 Seguridad y Control de Acceso

| Regla | Detalle |
|---|---|
| **Autenticación** | JWT firmado (HS256 o RS256). Expiración configurable. Renovación mediante refresh token. |
| **Cifrado de contraseñas** | BCrypt con factor de coste ≥ 12. |
| **Multi-tenant estricto** | Antes de devolver datos de un `hogar_id`, el backend verifica que el JWT del solicitante pertenezca a ese hogar. Respuesta `403 Forbidden` en caso contrario. |
| **MCP Passthrough Auth** | El Servidor MCP no genera ni almacena tokens. Propaga el JWT del usuario sin modificaciones en la cabecera `Authorization: Bearer <JWT>` de cada llamada al backend. |
| **Baneos temporales** | Los campos `bannedUntil (LocalDateTime)` y `banReason (String)` en la entidad `User` permiten penalizaciones con expiración automática. El método `isBanned()` calcula dinámicamente el estado comparando `bannedUntil` con `LocalDateTime.now()` en el servidor, sin persistir flags booleanos. El `JwtAuthenticationFilter` invoca `isBanned()` en cada petición tras validar el JWT: si el usuario está baneado, la petición se rechaza con `403 Forbidden` incluyendo la fecha de expiración, anulando operativamente cualquier JWT activo emitido antes del baneo sin necesidad de invalidar tokens en base de datos. |

---

## 3. Arquitectura y Stack Tecnológico

### 3.1 Diagrama de las Tres Capas

```
┌──────────────────────────────────────────────────────────────────┐
│                  CAPA 1: PRESENTACIÓN (Frontend)                 │
│                                                                  │
│   Next.js 15 · React · TypeScript                                │
│   - SSR / SSG para optimización de carga                         │
│   - Mapa interactivo (Leaflet / Mapbox)                          │
│   - Interfaz de chat → LLM (via API)                             │
│   - Gestión de estado: Zustand / React Query                     │
│                                                                  │
│   Comunica EXCLUSIVAMENTE vía HTTP REST con el Backend           │
└────────────────────────┬─────────────────────────────────────────┘
                         │  HTTP REST (JSON)
                         │  Authorization: Bearer <JWT>
┌────────────────────────▼─────────────────────────────────────────┐
│               CAPA 2: NEGOCIO Y PERSISTENCIA (Backend)           │
│                                                                  │
│   Java 21 · Spring Boot 3.x · Spring Security · Spring Data JPA  │
│   - Arquitectura limpia: Controller → Service → Repository       │
│   - Dominio de Alojamientos separado en Estructura (Accommodation)│
│     y Publicación Comercial (AccommodationListing) (SOLID)       │
│   - Lógica de negocio, validaciones, control de acceso           │
│   - Algoritmo de simplificación de deudas (en memoria)           │
│   - Generación de snapshots de auditoría (Append-Only)           │
│   - Integración con proveedor de almacenamiento cloud            │
│                                                                  │
│   Persistencia: PostgreSQL 15+ via Hibernate / Spring Data JPA   │
└──────────┬─────────────────────────────────┬─────────────────────┘
           │  JDBC / JPA                      │  HTTP REST + JWT
           │                                  │
┌──────────▼──────────┐            ┌──────────▼─────────────────────┐
│   PostgreSQL 15+    │            │  CAPA 3: EXTENSIÓN IA (MCP)    │
│   - UUID PKs        │            │                                 │
│   - JSONB para      │            │  Node.js · TypeScript           │
│     snapshots       │            │  - Implementa Model Context     │
│   - Triggers de     │            │    Protocol (JSON-RPC / SSE)    │
│     inmutabilidad   │            │  - NO accede a BD directamente  │
│   - Índices B-Tree  │            │  - Propaga JWT del usuario      │
│     geoespaciales   │            │  - Expone Tools al LLM          │
└─────────────────────┘            └─────────────────────────────────┘
```

### 3.2 Stack Tecnológico Detallado

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| **Frontend** | Next.js | 15.x | Framework React con SSR/SSG |
| **Frontend** | TypeScript | 5.x | Tipado estático |
| **Frontend** | Tailwind CSS | 3.x | Estilos utilitarios |
| **Frontend** | React Query | 5.x | Caché y sincronización de server state |
| **Frontend** | Zustand | 4.x | Estado global del cliente |
| **Frontend** | Leaflet / react-leaflet | Latest | Mapas interactivos |
| **Backend** | Java | 21 (LTS) | Lenguaje principal del backend |
| **Backend** | Spring Boot | 3.x | Framework principal |
| **Backend** | Spring Security | 6.x | Autenticación JWT y control de acceso |
| **Backend** | Spring Data JPA | 3.x | Abstracción de persistencia |
| **Backend** | Hibernate | 6.x | ORM (implementación JPA) |
| **Backend** | Lombok | Latest | Reducción de boilerplate |
| **Backend** | MapStruct | Latest | Mapeo DTO ↔ Entity |
| **Base de Datos** | PostgreSQL | 15+ | Motor relacional principal |
| **Base de Datos** | Flyway | Latest | Migraciones de esquema versionadas |
| **Servidor MCP** | Node.js | 20 LTS | Runtime del servidor MCP |
| **Servidor MCP** | TypeScript | 5.x | Tipado estático |
| **Servidor MCP** | MCP SDK | Latest | SDK oficial del protocolo MCP |
| **Cloud Storage** | AWS S3 / Cloudinary | — | Almacenamiento de imágenes |
| **Testing** | JUnit 5 + Mockito | Latest | Tests unitarios backend |
| **Testing** | Testcontainers | Latest | Tests de integración con PostgreSQL real |
| **Contenedores** | Docker + Compose | Latest | Entorno de desarrollo y despliegue |

---

## 4. Modelo de Datos

### 4.1 Diagrama Entidad-Relación

```
┌──────────────────────────────┐
│            USER              │
├──────────────────────────────┤
│ PK id             UUID       │◄──────────────────────────────────┐
│    nickname       VARCHAR    │                                   │
│    email          VARCHAR    │                                   │
│    password_hash  TEXT       │                                   │
│    first_name     VARCHAR    │                                   │
│    last_name_1    VARCHAR    │                                   │
│    last_name_2    VARCHAR    │                                   │
│    phone          VARCHAR    │                                   │
│    profile_pic_url TEXT      │                                   │
│    role           ENUM       │  (ADMIN, USER)                    │
│    created_at     TIMESTAMP  │                                   │
│    bannedUntil    TIMESTAMP  │  ← NULL = sin baneo activo        │
│    banReason      TEXT NULL  │  ← motivo de la sanción           │
└──────────────────────────────┘                                   │
         │                                                         │
         │ 1:N  (un usuario es propietario de alojamientos)        │
         ▼                                                         │
┌──────────────────────────────┐                                   │
│        ACCOMMODATION         │  ← Propiedad Física               │
├──────────────────────────────┤                                   │
│ PK id             UUID       │                                   │
│ FK owner_id       UUID ──────┼───────────────────────────────────┤
│    address        VARCHAR    │                                   │
│    city           VARCHAR    │                                   │
│    province       VARCHAR    │                                   │
│    country        VARCHAR    │                                   │
│    total_rooms    INT        │                                   │
│    free_rooms     INT        │                                   │
│    bathrooms      INT        │                                   │
│    square_meters  NUMERIC    │                                   │
│    latitude       NUMERIC    │                                   │
│    longitude      NUMERIC    │                                   │
│    amenities      VARCHAR[]  │  (Set<AmenityType> estructural)   │
│    created_at     TIMESTAMP  │                                   │
└─────────┬──────────────┬─────┘                                   │
          │              │ 1:N  (propiedad → varios anuncios)      │
          │              ▼                                         │
          │        ┌──────────────────────────────────────┐        │
          │        │         ACCOMMODATION_LISTING        │        │
          │        ├──────────────────────────────────────┤        │
          │        │ PK id                UUID            │        │
          │        │ FK accommodation_id  UUID ───────────┘        │
          │        │ FK host_id           UUID ────────────────────┤
          │        │    title             VARCHAR         │        │
          │        │    description       TEXT            │        │
          │        │    price_per_month   NUMERIC         │        │
          │        │    status            ENUM            │        │
          │        │    version           INT             │        │
          │        │    created_at        TIMESTAMP       │        │
          │        └──────────────────────┬───────────────┘        │
          │                               │                        │
          │ 1:N                           │ 1:N                    │
          ▼                               ▼                        │
┌──────────────────────────┐    ┌─────────────────────────────┐    │
│  ACCOMMODATION_IMAGE     │    │    ACCOMMODATION_REVIEW     │    │
├──────────────────────────┤    ├─────────────────────────────┤    │
│ PK id    UUID            │    │ PK id          UUID          │    │
│ FK accommodation_id UUID │    │ FK author_id ───────────────┼────┤
│ image_url TEXT           │    │ FK listing_id  UUID          │    │
│ display_order INT        │    │ rating         INT (1-5)     │    │
└──────────────────────────┘    │ comment        TEXT NULL     │    │
                                │ created_at     TIMESTAMP     │    │
                                └─────────────────────────────┘    │
                                                                   │
┌──────────────────────────────┐                                   │
│          HOGAR               │                                   │
├──────────────────────────────┤                                   │
│ PK id         UUID           │◄──────────────┐                   │
│    name       VARCHAR        │               │                   │
│    version    INT            │               │                   │
│    created_at TIMESTAMP      │               │                   │
└──────────────────────────────┘               │                   │
         │              │                      │                   │
         │ 1:N          │ 1:N                  │                   │
         ▼              ▼                  ┌───┴──────────────────┐│
┌──────────────┐  ┌───────────────┐        │    HOGAR_MEMBER      ││
│   EXPENSE    │  │     TASK      │        ├──────────────────────┤│
├──────────────┤  ├───────────────┤        │ FK hogar_id          ││
│ PK id  UUID  │  │ PK id  UUID   │        │ FK user_id ──────────┼┘
│ FK hogar_id  │  │ FK hogar_id   │        │    is_admin BOOLEAN  │
│ FK payer_id  │  │ FK assigned_to│        │    joined_at TIMESTAMP│
│ amount NUMERIC│ │ title VARCHAR │        └──────────────────────┘
│ description  │  │ description   │
│ version INT  │  │ is_completed  │
│ created_at   │  │ version INT   │
└──────┬───────┘  │ created_at    │
       │          └───────────────┘
       │ 1:N
       ▼
┌─────────────────────┐
│  EXPENSE_AFFECTED   │
├─────────────────────┤
│ FK expense_id       │
│ FK user_id          │
│    percentage NUMERIC│  (suma = 100 por expense_id)
└─────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                   AUDIT_SNAPSHOT_LOG                      │
│                   (APPEND-ONLY — sin UPDATE ni DELETE)    │
├───────────────────────────────────────────────────────────┤
│ PK id               UUID                                  │
│ FK user_id          UUID  (autor del cambio)              │
│    entity_type      VARCHAR  (EXPENSE | TASK)             │
│    entity_id        UUID                                  │
│    action_type      ENUM  (CREATE | UPDATE | DELETE)      │
│    snapshot_before  JSONB NULL                            │
│    snapshot_after   JSONB NULL                            │
│    server_timestamp TIMESTAMP (inyectado por servidor)    │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                   ACCOMMODATION_REPORT                    │
├───────────────────────────────────────────────────────────┤
│ PK id               UUID                                  │
│ FK listing_id       UUID                                  │
│ FK reporter_id      UUID NULL                             │
│    reason           ENUM      (SPAM, SCAM, etc.)          │
│    description      TEXT                                  │
│    status           ENUM      (PENDING, REVIEWED, etc.)   │
│    created_at       TIMESTAMP                             │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                      MESSAGE                              │
├───────────────────────────────────────────────────────────┤
│ PK id               UUID                                  │
│ FK sender_id        UUID                                  │
│ FK receiver_id      UUID                                  │
│ FK listing_id       UUID NULL                             │
│    content          TEXT                                  │
│    offer_amount     NUMERIC NULL  (si es oferta formal)   │
│    is_offer         BOOLEAN                               │
│    created_at       TIMESTAMP                             │
└───────────────────────────────────────────────────────────┘
```

### 4.2 Índices Críticos

```sql
-- Búsqueda de anuncios comerciales activos por ciudad y precio (en catálogo)
-- Nota: La ciudad se obtiene de la relación con la propiedad física (Accommodation)
CREATE INDEX idx_listing_status_price
    ON accommodation_listing(price_per_month)
    WHERE moderation_status = 'APPROVED' AND status = 'AVAILABLE';

-- Geolocalización (consultas de radio por mapa, sobre la propiedad física)
CREATE INDEX idx_accommodation_lat  ON accommodation(latitude);
CREATE INDEX idx_accommodation_lng  ON accommodation(longitude);
CREATE INDEX idx_accommodation_city ON accommodation(city);

-- Búsqueda de todos los anuncios de una propiedad física
CREATE INDEX idx_listing_accommodation_id
    ON accommodation_listing(accommodation_id);

-- Todos los anuncios publicados por un host
CREATE INDEX idx_listing_host_id
    ON accommodation_listing(host_id, created_at DESC);

-- Auditoría: consultas por hogar (a través de entity_id)
CREATE INDEX idx_audit_entity       ON audit_snapshot_log(entity_id, server_timestamp DESC);

-- Mensajería privada vinculada a anuncios comerciales
CREATE INDEX idx_message_receiver   ON message(receiver_id, created_at DESC);
CREATE INDEX idx_message_sender     ON message(sender_id, created_at DESC);

-- Denuncias: contar denuncias pendientes por anuncio comercial (clave para la regla de auto-moderación)
CREATE INDEX idx_report_listing_status
    ON accommodation_report(listing_id, status)
    WHERE status = 'PENDING';
```

### 4.3 Trigger de Inmutabilidad (PostgreSQL)

```sql
CREATE OR REPLACE FUNCTION fn_block_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'VIOLACIÓN DE INTEGRIDAD: La tabla audit_snapshot_log es append-only. '
        'Operación % sobre el registro % está prohibida.',
        TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_snapshot_log
    FOR EACH ROW EXECUTE FUNCTION fn_block_audit_mutation();
```

### 4.4 Enumerados de Base de Datos

```sql
CREATE TYPE user_role           AS ENUM ('ADMIN', 'USER');
CREATE TYPE listing_status      AS ENUM ('AVAILABLE', 'PAUSED', 'RENTED');
CREATE TYPE moderation_status   AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE audit_action        AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE report_reason       AS ENUM ('SPAM', 'SCAM', 'INAPPROPRIATE', 'MISLEADING');
CREATE TYPE report_status       AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');
```

---

## 5. Endpoints de la REST API

> **Base URL:** `http://localhost:8080/api/v1`
> **Autenticación:** `Authorization: Bearer <JWT>` en todos los endpoints marcados con 🔒

### 5.1 Autenticación (`/auth`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Registro de nuevo usuario. Body: `{nickname, email, password, firstName, ...}` |
| `POST` | `/auth/login` | ❌ | Login. Devuelve `{accessToken, refreshToken, expiresIn}` |
| `POST` | `/auth/refresh` | ❌ | Renueva el access token con el refresh token |
| `POST` | `/auth/logout` | 🔒 | Invalida el refresh token del usuario |

### 5.2 Usuarios (`/users`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/users/me` | 🔒 | Perfil del usuario autenticado |
| `PUT` | `/users/me` | 🔒 | Actualizar datos propios (nombre, teléfono, avatar) |
| `GET` | `/users/{userId}` | 🔒 | Perfil público de un usuario |
| `GET` | `/users/{userId}/reviews` | 🔒 | Valoraciones recibidas por un usuario |
| `POST` | `/users/{userId}/reviews` | 🔒 | Emitir valoración sobre un usuario |

### 5.3 Alojamientos Físicos (`/accommodations`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/accommodations` | 🔒 | Registrar una propiedad física. Body: `{address, city, province, country, totalRooms, freeRooms, bathrooms, squareMeters, latitude, longitude, amenities[]}` |
| `GET` | `/accommodations/{id}` | 🔒 | Obtener los detalles de una propiedad física |
| `PUT` | `/accommodations/{id}` | 🔒 | Actualizar la propiedad física propia |
| `DELETE` | `/accommodations/{id}` | 🔒 | Eliminar propiedad física (solo si no tiene listings activos/pendientes) |
| `POST` | `/accommodations/{id}/images` | 🔒 | Añadir URL de imagen física subida en Cloudinary. Body: `{imageUrl, displayOrder}` |
| `DELETE` | `/accommodations/{id}/images/{imageId}` | 🔒 | Eliminar imagen física del alojamiento |

### 5.4 Publicaciones Comerciales (`/listings`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/listings` | ❌ | Listar anuncios del catálogo activos (`AVAILABLE` y `APPROVED`). Query params: `city`, `minPrice`, `maxPrice`, `page`, `size` |
| `GET` | `/listings/{id}` | ❌ | Detalle del anuncio (incluye datos del alojamiento físico `Accommodation`) |
| `POST` | `/accommodations/{accommodationId}/listings` | 🔒 | Publicar anuncio comercial para una propiedad propia. Queda en `PENDIENTE` de moderación. Body: `{title, description, pricePerMonth, deposit, availableFrom, availableTo, houseRules}` |
| `PUT` | `/listings/{id}` | 🔒 | Actualizar anuncio propio (solo si sigue en `PENDIENTE` o visible en catálogo) |
| `DELETE` | `/listings/{id}` | 🔒 | Eliminar (borrado lógico) del anuncio propio o cualquiera (ADMIN) |
| `GET` | `/listings/{id}/reviews` | ❌ | Valoraciones recibidas por este anuncio comercial |
| `POST` | `/listings/{id}/reviews` | 🔒 | Publicar valoración sobre la estancia en este anuncio |
| `DELETE` | `/listings/{id}/reviews/{reviewId}` | 🔒 ADMIN | Moderar y eliminar valoración del catálogo |
| `POST` | `/listings/{id}/reports` | ❌/🔒 | Enviar denuncia sobre el anuncio. Body: `{reason, description}`. Anonymous si no se adjunta JWT. |

#### Endpoints de Administración y Moderación

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/admin/listings/pending` | 🔒 ADMIN | Listar anuncios comerciales en estado de moderación `PENDIENTE` |
| `POST` | `/admin/listings/{id}/approve` | 🔒 ADMIN | Aprobar anuncio → Cambia a moderación `APPROVED` y visibilidad `AVAILABLE` |
| `POST` | `/admin/listings/{id}/reject` | 🔒 ADMIN | Rechazar anuncio → Cambia a moderación `REJECTED` |
| `GET` | `/admin/listings/{id}/reports` | 🔒 ADMIN | Listar las denuncias recibidas por un anuncio comercial |
| `POST` | `/admin/listings/{id}/reports/{reportId}/review` | 🔒 ADMIN | Marcar denuncia como revisada (`REVIEWED`) |
| `POST` | `/admin/listings/{id}/reports/{reportId}/dismiss` | 🔒 ADMIN | Desestimar denuncia (`DISMISSED`) |
| `POST` | `/admin/users/{userId}/ban` | 🔒 ADMIN | Banear temporalmente a un usuario. Body: `{bannedUntil, banReason}` |

### 5.5 Mensajería (`/messages`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/messages/conversations` | 🔒 | Listar conversaciones del usuario |
| `GET` | `/messages/conversations/{userId}` | 🔒 | Mensajes con un usuario concreto |
| `POST` | `/messages` | 🔒 | Enviar mensaje vinculando `listingId` (texto o con `isOffer: true` y `offerAmount`) |

### 5.6 Hogares (`/home`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/home` | 🔒 | Crear un nuevo hogar (el creador es admin del hogar) |
| `GET` | `/home/{hogarId}` | 🔒 | Detalle del hogar (solo miembros) |
| `PUT` | `/home/{hogarId}` | 🔒 HOGAR-ADMIN | Actualizar nombre del hogar |
| `POST` | `/home/{hogarId}/members` | 🔒 HOGAR-ADMIN | Invitar miembro por email o nickname |
| `DELETE` | `/home/{hogarId}/members/{userId}` | 🔒 HOGAR-ADMIN | Eliminar miembro (solo si balance neto = 0) |
| `GET` | `/home/{hogarId}/balances` | 🔒 | Balances actuales y grafo de deudas simplificado |

### 5.7 Gastos (`/home/{hogarId}/expenses`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/home/{hogarId}/expenses` | 🔒 | Listar gastos del hogar (`page`, `size`, `from`, `to`) |
| `GET` | `/home/{hogarId}/expenses/{expenseId}` | 🔒 | Detalle de un gasto |
| `POST` | `/home/{hogarId}/expenses` | 🔒 | Registrar nuevo gasto (`payerId`, `amount`, `affectedUsers[]`, `percentages[]`) |
| `PUT` | `/home/{hogarId}/expenses/{expenseId}` | 🔒 | Modificar gasto (genera snapshot de auditoría) |
| `DELETE` | `/home/{hogarId}/expenses/{expenseId}` | 🔒 | Eliminar gasto (genera snapshot de auditoría) |

### 5.8 Tareas (`/home/{hogarId}/tasks`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/home/{hogarId}/tasks` | 🔒 | Listar tareas del hogar |
| `POST` | `/home/{hogarId}/tasks` | 🔒 | Crear tarea (`title`, `description`, `assignedTo`) |
| `PUT` | `/home/{hogarId}/tasks/{taskId}` | 🔒 | Actualizar tarea (genera snapshot de auditoría) |
| `PATCH` | `/home/{hogarId}/tasks/{taskId}/toggle` | 🔒 | Conmutar estado `COMPLETADA` / `PENDIENTE` |
| `DELETE` | `/home/{hogarId}/tasks/{taskId}` | 🔒 | Eliminar tarea |

### 5.9 Auditoría (`/audit`)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/audit/home/{homeId}` | 🔒 | Feed cronológico de actividad del hogar. Query: `limit`, `page`, `entityType` |
| `GET` | `/audit/home/{homeId}/expense/{expenseId}` | 🔒 | Historial completo de cambios de un gasto |
| `GET` | `/audit/home/{homeId}/task/{taskId}` | 🔒 | Historial completo de cambios de una tarea |

### 5.10 Codificación de Respuestas de Error

```json
{
  "timestamp": "2024-11-15T10:30:00.000Z",
  "status": 403,
  "error": "Forbidden",
  "message": "El usuario no pertenece al hogar solicitado.",
  "path": "/api/v1/home/abc123/balances"
}
```

| Código | Escenario |
|---|---|
| `400` | Validación de datos (porcentajes ≠ 100 %, imágenes insuficientes, etc.) |
| `401` | Token JWT ausente, expirado o inválido |
| `403` | Acceso a recursos de otro hogar / acciones sin permiso de rol / usuario baneado temporalmente (incluye `bannedUntil` en el cuerpo del error) |
| `404` | Recurso no encontrado |
| `409` | Conflicto de versión (`OptimisticLockingFailureException`) |
| `500` | Error interno del servidor |

---

## 6. Especificación del Servidor MCP

### 6.1 Arquitectura y Flujo de Comunicación

```
 ┌────────────────────────────────────────────────────────────────┐
  │  CLIENTE NEXT.JS (Interfaz de Chat)                           │
  │  - Captura input del usuario                                   │
  │  - Inyecta JWT en metadatos del contexto MCP                   │
  └────────────────────────┬───────────────────────────────────────┘
                           │ JSON-RPC 2.0 sobre SSE / stdio
                           │ Contexto: { jwt: "Bearer eyJ..." }
  ┌────────────────────────▼───────────────────────────────────────┐
  │  SERVIDOR MCP (Node.js / TypeScript)                          │
  │  - Parsea la petición JSON-RPC                                 │
  │  - Extrae JWT del contexto                                     │
  │  - Selecciona la herramienta (tool) apropiada                  │
  │  - Llama al endpoint REST del Backend con el JWT               │
  └────────────────────────┬───────────────────────────────────────┘
                           │ HTTP REST
                           │ Authorization: Bearer <JWT>
  ┌────────────────────────▼───────────────────────────────────────┐
  │  API SPRING BOOT (Backend)                                    │
  │  - Valida JWT                                                  │
  │  - Verifica pertenencia al hogar_id solicitado                 │
  │  - Devuelve datos o 403 Forbidden                              │
  └────────────────────────────────────────────────────────────────┘
```

### 6.2 Protocolo de Seguridad Multi-Tenant

El servidor MCP **no almacena, no genera y no modifica** tokens JWT. Actúa exclusivamente como proxy autenticado. Si el backend devuelve `401` o `403`, el servidor MCP propaga el error al LLM sin intentar acceder a datos alternativos.

### 6.3 Catálogo de Herramientas (Tools)

---

#### Tool 1: `auditar_conflictos_hogar`

**Descripción:** Recupera y analiza la secuencia cronológica de snapshots de auditoría de un hogar para resolver malentendidos entre convivientes sobre quién modificó qué y cuándo.

**Parámetros de entrada:**

```typescript
{
  hogarId:    string,   // obligatorio — UUID del hogar
  limite?:    number,   // opcional — máximo de registros (default: 50)
  entityType?: "EXPENSE" | "TASK"  // opcional — filtrar por tipo
}
```

**Endpoint interno consumido:**

```
GET /api/v1/audit/home/{homeId}?limit={limite}&entityType={entityType}
Authorization: Bearer <JWT propagado>
```

**Salida estructurada para el LLM:**

```
[{
  "timestamp": "2024-11-15T10:30:00Z",
  "autor": "maria_garcia",
  "accion": "UPDATE",
  "entidad": "EXPENSE",
  "cambios": {
    "antes": { "amount": 50.00, "description": "Agua" },
    "despues": { "amount": 65.00, "description": "Agua + electricidad" }
  }
}]
```

**Caso de uso LLM de ejemplo:**

> *"El gasto de 'Agua' fue modificado por maria_garcia el 15/11/2024 a las 10:30. El importe subió de 50€ a 65€ y la descripción cambió de 'Agua' a 'Agua + electricidad'. Antes de ese cambio, nadie más había tocado ese gasto."*

---

#### Tool 2: `analizar_balances_y_deudas`

**Descripción:** Extrae el grafo de deudas consolidado y simplificado del hogar para proporcionar recomendaciones de liquidación eficiente.

**Parámetros de entrada:**

```typescript
{
  hogarId: string   // obligatorio — UUID del hogar
}
```

**Endpoint interno consumido:**

```
GET /api/v1/home/{homeId}/balances
Authorization: Bearer <JWT propagado>
```

**Salida estructurada para el LLM:**

```json
{
  "balances": [
    { "usuario": "carlos", "balance": -30.00, "estado": "DEUDOR" },
    { "usuario": "maria",  "balance": +15.00, "estado": "ACREEDOR" },
    { "usuario": "pablo",  "balance": +15.00, "estado": "ACREEDOR" }
  ],
  "transaccionesOptimas": [
    { "de": "carlos", "a": "maria",  "importe": 15.00 },
    { "de": "carlos", "a": "pablo",  "importe": 15.00 }
  ]
}
```

**Caso de uso LLM de ejemplo:**

> *"Para saldar las cuentas del mes con el mínimo de transferencias, Carlos necesita hacer dos pagos: 15€ a María y 15€ a Pablo. Con eso quedan todos a cero."*

---

#### Tool 3: `busqueda_semantica_alojamientos`

**Descripción:** Permite al LLM cruzar criterios en lenguaje natural del usuario con las valoraciones y descripciones textuales de alojamientos, superando las limitaciones del filtrado por campos estructurados.

**Parámetros de entrada:**

```typescript
{
  criterioSemantico: string,  // obligatorio — texto libre con preferencias
  ciudad:            string   // obligatorio — filtro geográfico base
}
```

**Endpoint interno consumido:**

```
GET /api/v1/accommodations/reviews?city={ciudad}
Authorization: Bearer <JWT propagado>
```

**Proceso interno del LLM:**

1. Recibe el listado de alojamientos con sus descripciones y comentarios de usuarios.
2. Evaluá cualitativamente qué inmuebles o propietarios encajan con el `criterioSemantico`.
3. Devuelve un ranking razonado con justificaciones basadas en experiencias reales de otros usuarios.

**Caso de uso LLM de ejemplo:**

> *"Basándome en las valoraciones, el alojamiento de calle Alameda 12 tiene 4 comentarios que mencionan explícitamente la 'amabilidad del casero' y la 'luminosidad'. Es el que mejor encaja con lo que buscas."*

### 6.4 Manejo de Errores en el Servidor MCP

```typescript
// Respuesta de error propagada al LLM
{
  "error": {
    "code": -32603,
    "message": "Backend returned 403: El usuario no pertenece al hogar solicitado.",
    "data": { "httpStatus": 403 }
  }
}
```

---

## 7. Vistas y Componentes del Frontend

### 7.1 Mapa de Rutas (Next.js App Router)

```
app/
├── (public)/
│   ├── page.tsx                    # Home — listado de anuncios + mapa
│   ├── listings/
│   │   └── [id]/page.tsx           # Detalle de la publicación (anuncio)
│   └── auth/
│       ├── login/page.tsx          # Login
│       └── register/page.tsx       # Registro
│
├── (private)/
│   ├── layout.tsx                  # Layout con guard de autenticación
│   ├── dashboard/page.tsx          # Panel del usuario autenticado
│   ├── accommodations/
│   │   ├── new/page.tsx            # Formulario de alta de propiedad física
│   │   └── page.tsx                # Listado de mis propiedades físicas
│   ├── listings/
│   │   └── new/page.tsx            # Crear un anuncio a partir de una propiedad propia
│   ├── messages/
│   │   └── [userId]/page.tsx       # Conversación con un usuario
│   ├── hogar/
│   │   ├── page.tsx                # Selección / creación de hogar
│   │   └── [hogarId]/
│   │       ├── page.tsx            # Dashboard del hogar
│   │       ├── expenses/page.tsx   # Listado y formulario de gastos
│   │       ├── tasks/page.tsx      # Listado y gestión de tareas
│   │       ├── balances/page.tsx   # Balances visuales + grafo de deudas
│   │       ├── audit/page.tsx      # Feed cronológico de actividad
│   │       └── chat/page.tsx       # Chat con el LLM (MCP integrado)
│   └── profile/
│       └── [userId]/page.tsx       # Perfil público de usuario
│
└── (admin)/
    ├── layout.tsx                  # Layout con guard de rol ADMIN
    └── moderation/
        ├── pending/page.tsx        # Anuncios comerciales pendientes de moderación
        └── reviews/page.tsx        # Moderación de valoraciones
```

### 7.2 Descripción de Vistas Clave

#### 7.2.1 Home (Página Pública Principal)

**Componentes:**
- `<SearchBar />` — Filtros de ciudad, precio mínimo y máximo.
- `<AccommodationMap />` — Mapa Leaflet con marcadores geolocalizados de anuncios disponibles. Al hacer clic en un marcador, muestra una `<PopupCard />` con foto, título y precio.
- `<AccommodationGrid />` — Grid de tarjetas de anuncios sincronizado con los filtros del mapa.
- `<AccommodationCard />` — Tarjeta individual del anuncio con foto principal (Cloudinary), título, precio, ciudad y rating medio de valoraciones.

**Comportamiento:**
- Los filtros actualizan el mapa y la cuadrícula de forma reactiva mediante React Query.
- No requiere autenticación.

#### 7.2.2 Dashboard del Hogar

**Componentes:**
- `<BalanceSummaryWidget />` — Muestra un círculo verde/rojo por cada miembro con su balance neto.
- `<RecentExpensesList />` — Últimos 5 gastos del hogar con paginación.
- `<PendingTasksList />` — Tareas con estado `PENDIENTE` y botón de completar.
- `<ActivityFeedPreview />` — Últimos 5 registros de auditoría en lenguaje legible.

#### 7.2.3 Vista de Balances

**Componentes:**
- `<MemberBalanceCard userId amount status />` — Tarjeta por miembro con indicador de color.
- `<DebtSimplificationPanel />` — Lista de transacciones óptimas recomendadas.
- `<ExpenseHistoryChart />` — Gráfico de evolución de gastos por mes (Recharts).

**Regla visual:** El indicador de balance es un círculo de 24px de diámetro:
- 🟢 Verde `#22c55e` → balance positivo (le deben dinero).
- 🔴 Rojo `#ef4444` → balance negativo (debe dinero al grupo).
- ⚪ Gris `#94a3b8` → balance = 0.

#### 7.2.4 Feed de Actividad (Auditoría)

**Componentes:**
- `<AuditFeedItem />` — Muestra cada snapshot en lenguaje natural: *"María subió el gasto 'Electricidad' de 45€ a 62€ el 14 nov a las 09:15."*
- `<AuditFilterBar />` — Filtros por tipo de entidad (`EXPENSE` / `TASK`) y rango de fechas.

#### 7.2.5 Chat con LLM (Integración MCP)

**Componentes:**
- `<ChatWindow />` — Historial de mensajes entre usuario y LLM.
- `<ChatInput />` — Campo de texto con envío al LLM vía la API de chat.
- `<ToolCallIndicator />` — Muestra visualmente cuando el LLM invoca una herramienta MCP.

**Flujo de datos:**
1. El usuario escribe en `<ChatInput />`.
2. El frontend llama a la API del LLM con el mensaje y el JWT del usuario en los metadatos de contexto.
3. El LLM decide si invocar una herramienta MCP.
4. El servidor MCP llama al backend con el JWT propagado.
5. La respuesta vuelve al LLM y este genera la respuesta final.
6. `<ChatWindow />` muestra la respuesta.

### 7.3 Componentes Compartidos (Shared Components)

| Componente | Descripción |
|---|---|
| `<StarRating rating onChange? />` | Selector de valoración de 1 a 5 estrellas |
| `<UserAvatar userId size />` | Avatar con fallback a iniciales |
| `<PriceTag amount currency />` | Formateo de moneda consistente |
| `<StatusBadge status />` | Badge de color para estados de anuncio/moderación |
| `<ConfirmationModal />` | Modal reutilizable para acciones destructivas |
| `<Pagination page total onChange />` | Componente de paginación estándar |
| `<LoadingSpinner />` | Indicador de carga |
| `<ErrorBoundary />` | Captura y muestra errores de renderizado |

---

## 8. Infraestructura Docker

### 8.1 `docker-compose.yml` (Entorno de Desarrollo)

```yaml
version: "3.9"

services:

  # ─── Base de Datos ───────────────────────────────────────────
  postgres:
    image: postgres:15-alpine
    container_name: tfg_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB:       tfg_db
      POSTGRES_USER:     tfg_user
      POSTGRES_PASSWORD: tfg_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tfg_user -d tfg_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Backend Spring Boot ─────────────────────────────────────
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
      SPRING_DATASOURCE_URL:      jdbc:postgresql://postgres:5432/tfg_db
      SPRING_DATASOURCE_USERNAME: tfg_user
      SPRING_DATASOURCE_PASSWORD: tfg_password
      SPRING_JPA_HIBERNATE_DDL_AUTO: validate
      JWT_SECRET:                 ${JWT_SECRET}
      JWT_EXPIRATION_MS:          86400000
      CLOUD_STORAGE_BUCKET:       ${CLOUD_STORAGE_BUCKET}
      CLOUD_STORAGE_KEY_ID:       ${CLOUD_STORAGE_KEY_ID}
      CLOUD_STORAGE_SECRET:       ${CLOUD_STORAGE_SECRET}
    ports:
      - "8080:8080"

  # ─── Servidor MCP ────────────────────────────────────────────
  mcp-server:
    build:
      context: ./mcp-server
      dockerfile: Dockerfile
    container_name: tfg_mcp
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      BACKEND_BASE_URL: http://backend:8080/api/v1
      MCP_PORT:         3001
    ports:
      - "3001:3001"

  # ─── Frontend Next.js ────────────────────────────────────────
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
      NEXT_PUBLIC_API_URL:     http://localhost:8080/api/v1
      NEXT_PUBLIC_MCP_URL:     http://localhost:3001
      NEXT_PUBLIC_MAPS_TOKEN:  ${MAPS_TOKEN}
    ports:
      - "3000:3000"

volumes:
  postgres_data:
    driver: local
```

### 8.2 `Dockerfile` del Backend (Spring Boot)

```dockerfile
# Etapa de construcción
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw package -DskipTests

# Etapa de ejecución
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.3 `Dockerfile` del Servidor MCP (Node.js)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 8.4 `Dockerfile` del Frontend (Next.js)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 9. Fases de Desarrollo y Desglose de Tareas

> **Metodología:** Desarrollo secuencial para desarrollador único. Cada fase tiene entregables verificables. TDD obligatorio desde la Fase 2 para el motor financiero.
>
> **Convención de ramas Git:** `feat/<fase>-<descripcion>`, `fix/<descripcion>`, `test/<descripcion>`

---

### Fase 0 — Configuración del Entorno y Scaffolding (Semana 0)

**Objetivo:** Tener un entorno de desarrollo funcional con todas las herramientas configuradas antes de escribir una sola línea de lógica.

**Tareas:**

- [X] Crear repositorio Git con estructura monorepo: `/backend`, `/frontend`, `/mcp-server`
- [X] Inicializar proyecto Spring Boot 3.x con Java 21 (Spring Initializr):
  - Dependencias: `spring-web`, `spring-data-jpa`, `spring-security`, `postgresql`, `lombok`, `mapstruct`, `flyway`, `validation`
- [X] Configurar `docker-compose.yml` con PostgreSQL y levantar base de datos local
- [X] Configurar Flyway: crear migración `V1__init_schema.sql` con el esquema completo del modelo de datos
- [ ] Inicializar proyecto Next.js 15 con TypeScript, Tailwind CSS y App Router
- [ ] Inicializar proyecto Node.js TypeScript para el servidor MCP
- [ ] Configurar ESLint + Prettier en frontend y MCP server
- [ ] Configurar Checkstyle / SpotBugs en el backend
- [ ] Crear archivo `.env.example` con todas las variables de entorno necesarias

**Entregable verificable:** `docker-compose up` levanta PostgreSQL, backend arranca con `200 OK` en `/api/v1/health`, frontend carga en `localhost:3000`.

---

### Fase 1 — Núcleo de Seguridad y Gestión de Usuarios (Semanas 1-2)

**Objetivo:** Sistema de autenticación robusto y gestión de perfiles de usuario.

**Principios SOLID aplicados:**
- `UserService` (interfaz `IUserService`) → única responsabilidad: lógica de usuario
- `JwtTokenProvider` (interfaz `ITokenProvider`) → única responsabilidad: generación y validación de tokens
- `SecurityConfig` depende de la abstracción `ITokenProvider`, no de la implementación concreta

**Tareas — Backend:**

- [ ] Crear entidad JPA `User` con todos los campos del modelo (incluyendo `@Version` si aplica)
- [ ] Crear interfaz `IUserRepository extends JpaRepository<User, UUID>` con métodos `findByEmail` y `findByNickname`
- [ ] Diseñar interfaz `IUserService` con métodos: `register`, `findById`, `updateProfile`, `findByNicknameOrEmail`
- [ ] Implementar `UserServiceImpl implements IUserService` con cifrado BCrypt (factor 12)
- [ ] Diseñar interfaz `ITokenProvider` con métodos: `generateAccessToken`, `generateRefreshToken`, `validateToken`, `extractUserId`
- [ ] Implementar `JwtTokenProviderImpl implements ITokenProvider`
- [ ] Implementar filtro `JwtAuthenticationFilter extends OncePerRequestFilter` inyectando `ITokenProvider`
- [ ] Implementar `AuthController` con endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] Implementar `UserController` con endpoints: `GET /users/me`, `PUT /users/me`, `GET /users/{userId}`
- [ ] Crear DTOs (`RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserProfileDto`) con validaciones `@NotBlank`, `@Email`, `@Size`
- [ ] Configurar `SecurityFilterChain`: rutas públicas (`/auth/**`) vs. protegidas
- [ ] Configurar manejo global de excepciones con `@RestControllerAdvice`

**Tareas — Tests (TDD-compatible):**

- [ ] Test unitario: `UserServiceImplTest` — registro con email duplicado lanza `UserAlreadyExistsException`
- [ ] Test unitario: `JwtTokenProviderImplTest` — token expirado lanza excepción, token válido extrae `userId` correctamente
- [ ] Test de integración: `AuthControllerIT` con Testcontainers — registro, login, obtención de perfil

**Entregable verificable:** Un usuario puede registrarse, iniciar sesión y obtener su perfil con token JWT válido. Intentos con credenciales incorrectas devuelven `401`.

---

### Fase 2 — Motor Financiero (TDD Obligatorio) (Semanas 3-4)

**Objetivo:** Implementar el núcleo del módulo de gastos compartidos con cobertura de tests completa antes de escribir el código de producción.

> **Regla de TDD:** Para cada clase de lógica financiera, el ciclo será: 🔴 Escribir test que falla → 🟢 Escribir código mínimo que lo pasa → 🔵 Refactorizar.

**Principios SOLID aplicados:**
- `DebtSimplifierEngine` (interfaz): el algoritmo de simplificación es intercambiable sin modificar `HogarService`
- `ExpenseService` (interfaz `IExpenseService`): única responsabilidad, sin conocimiento del algoritmo de simplificación
- `AuditService` (interfaz `IAuditService`): única responsabilidad de registrar snapshots, invocado por `ExpenseService` via DIP

**Ciclos TDD — `DebtSimplifierEngine`:**

- [ ] 🔴 **Test 1:** `simplify([A→B: 10€, B→C: 10€])` → `[A→C: 10€]` *(regla de tránsito)*
- [ ] 🟢 Implementar `SimpleTransitDebtSimplifier implements DebtSimplifierEngine`
- [ ] 🔴 **Test 2:** `simplify([A→B: 30€, C→B: 20€])` → `[A→B: 30€, C→B: 20€]` *(sin simplificación posible)*
- [ ] 🟢 Ajustar implementación
- [ ] 🔴 **Test 3:** `simplify([A→B: 10€, B→C: 5€, B→D: 5€])` → `[A→C: 5€, A→D: 5€]`
- [ ] 🟢 Ajustar implementación
- [ ] 🔵 Refactorizar para claridad sin romper tests
- [ ] 🔴 **Test 4 (porcentajes personalizados):** Gasto de 100€, pagador A, afectados [B 70%, C 30%] → B debe 70€ a A, C debe 30€ a A
- [ ] 🟢 Implementar validación y prorrateo en `ExpenseServiceImpl`
- [ ] 🔴 **Test 5 (porcentajes inválidos):** Porcentajes [60%, 30%] = 90% → lanza `InvalidPercentageDistributionException`
- [ ] 🟢 Añadir validación

**Tareas — Backend:**

- [ ] Crear entidades JPA: `Hogar`, `HogarMember`, `Expense`, `ExpenseAffected` con `@Version` donde corresponda
- [ ] Crear migraciones Flyway para estas tablas con índices y constraint de porcentajes
- [ ] Diseñar interfaz `IHogarService`: `createHogar`, `inviteMember`, `removeMember`, `getHogarById`
- [ ] Implementar `HogarServiceImpl implements IHogarService` con validación de balance antes de eliminar miembro
- [ ] Diseñar interfaz `IExpenseService`: `createExpense`, `updateExpense`, `deleteExpense`, `getExpensesByHogar`
- [ ] Implementar `ExpenseServiceImpl implements IExpenseService` invocando `IAuditService` en cada mutación
- [ ] Diseñar interfaz `DebtSimplifierEngine`: `simplify(List<RawDebt>): List<SimplifiedDebt>`
- [ ] Implementar `SimpleTransitDebtSimplifier implements DebtSimplifierEngine`
- [ ] Implementar endpoint `GET /home/{homeId}/balances` que invoca `DebtSimplifierEngine`
- [ ] Implementar `HogarController` y `ExpenseController` con sus endpoints correspondientes

**Tests adicionales:**

- [ ] Test de integración `ExpenseServiceIT` con Testcontainers: crear gasto, verificar que se genera snapshot en `AUDIT_SNAPSHOT_LOG`
- [ ] Test de concurrencia: dos hilos modifican el mismo `Expense` simultáneamente → segundo hilo recibe `409 Conflict`

**Entregable verificable:** Cobertura de tests > 90 % en las clases del motor financiero. El endpoint de balances devuelve el grafo de deudas simplificado correcto para los escenarios de TDD.

---

### Fase 3 — Subsistema de Auditoría e Inmutabilidad (Semana 5)

**Objetivo:** Implementar la capa de trazabilidad append-only con captura automática de snapshots.

**Principios SOLID aplicados:**
- `IAuditService` con único método `recordSnapshot(entityType, entityId, before, after, userId)` → SRP
- El `AuditLogRepository` expone solo `save` y métodos `find*`. Los métodos `delete` y `update` no existen en la interfaz → ISP
- `ExpenseServiceImpl` y `TaskServiceImpl` dependen de `IAuditService` (abstracción), no de `AuditServiceImpl` → DIP

**Tareas:**

- [ ] Crear entidad JPA `AuditSnapshotLog` con campos `@Column(updatable = false)` en todos sus campos
- [ ] Diseñar interfaz `IAuditLogRepository extends JpaRepository` con métodos solo de lectura y `save`; eliminar explícitamente `deleteById` sobreescribiendo para lanzar `UnsupportedOperationException`
- [ ] Diseñar interfaz `IAuditService` con método `recordSnapshot(...)`
- [ ] Implementar `AuditServiceImpl implements IAuditService` que serializa los estados como JSONB usando Jackson
- [ ] Implementar `AuditEntityListener` con `@PreUpdate` y `@PreRemove` sobre `AuditSnapshotLog` que lanza `AuditImmutabilityViolationException`
- [ ] Verificar que el trigger de PostgreSQL de inmutabilidad está activo en migración Flyway
- [ ] Crear `TaskEntity` con `@Version`, entidad `Task` y su servicio `ITaskService` / `TaskServiceImpl`
- [ ] Implementar `TaskController` con todos los endpoints de tareas
- [ ] Implementar endpoint `GET /audit/home/{homeId}` con paginación y filtros
- [ ] Implementar transformación de snapshots JSONB a texto legible en `AuditFeedFormatter`

**Tests:**

- [ ] Test unitario: intentar `auditLogRepository.deleteById(...)` lanza `UnsupportedOperationException`
- [ ] Test de integración: crear gasto → actualizar gasto → verificar exactamente 2 registros en `AUDIT_SNAPSHOT_LOG` con `snapshot_before` y `snapshot_after` correctos
- [ ] Test de integración: intentar UPDATE SQL directo sobre `audit_snapshot_log` es bloqueado por trigger de PostgreSQL

**Entregable verificable:** Cualquier mutación sobre `EXPENSE` o `TASK` genera automáticamente un snapshot inmutable. El feed de actividad devuelve los cambios en orden cronológico.

---

### Fase 4 — Módulo de Alojamiento: Estructura Física e Imágenes (Semana 6)

**Objetivo:** Implementar la base de datos de las propiedades físicas (`Accommodation`) y la integración del almacenamiento cloud en Cloudinary para las imágenes.

**Principios SOLID aplicados:**
- `IAccommodationService` gestiona exclusivamente el inventario físico e inmutable de propiedades → SRP
- `IImageStorageService` (interfaz) de almacenamiento cloud: permite intercambiar proveedores fácilmente sin alterar la lógica de negocio → OCP / DIP

**Tareas — Backend:**

- [ ] Crear entidades JPA `Accommodation` (propiedad física) y `AccommodationImage` (imágenes de Cloudinary asociadas a una propiedad física)
- [ ] Crear migraciones Flyway: tabla `accommodation` con índices B-Tree geoespaciales sobre `(latitude, longitude)` y `city`, y tabla `accommodation_image`
- [ ] Diseñar interfaz `IImageStorageService` con métodos `uploadImage(file): String` y `deleteImage(publicId): void`
- [ ] Implementar `CloudinaryImageStorageService implements IImageStorageService`
- [ ] Diseñar interfaz `IAccommodationService` para administración física: `registerProperty`, `findById`, `updateProperty`, `deleteProperty`, `addImage`, `deleteImage`
- [ ] Implementar `AccommodationServiceImpl implements IAccommodationService` inyectando `IImageStorageService`
- [ ] Implementar `AccommodationController` con los endpoints de gestión física (`POST /accommodations`, `GET /accommodations/{id}`, `PUT /accommodations/{id}`, `DELETE /accommodations/{id}`) y de subida de imágenes (`POST /accommodations/{id}/images`, `DELETE /accommodations/{id}/images/{imageId}`)

**Tareas — Tests:**

- [ ] Test unitario: `CloudinaryImageStorageServiceTest` mockeando el SDK de Cloudinary
- [ ] Test de integración: crear alojamiento, subir imágenes y validar que las URLs e índices de orden de visualización persisten correctamente en la BD

**Entregable verificable:** Un propietario autenticado puede registrar su propiedad física, geolocalizarla con coordenadas latitud/longitud y subir múltiples imágenes que quedan persistidas con su URL pública de Cloudinary.

---

### Fase 5 — Publicación y Catálogo Comercial (Listings) (Semana 7)

**Objetivo:** Implementar la publicación de anuncios comerciales (`AccommodationListing`), el buscador catalogado con filtros y geolocalización, la lógica de moderación por administrador y el sistema de reportes/valoraciones.

**Principios SOLID aplicados:**
- `IAccommodationListingService` encapsula exclusivamente el ciclo de vida del anuncio y el catálogo → SRP
- `IAccommodationReportService` e `IReviewService` desacoplados en servicios independientes de la publicación comercial → SRP

**Tareas — Backend:**

- [ ] Crear entidades JPA `AccommodationListing`, `AccommodationReview`, `AccommodationReport` y `Message` (con soporte para ofertas económicas)
- [ ] Crear migraciones Flyway: tablas `accommodation_listing`, `accommodation_review`, `accommodation_report`, y `message`
- [ ] Agregar índices críticos `idx_listing_status_price`, `idx_report_listing_status`, etc.
- [ ] Añadir campos `bannedUntil` y `banReason` a `User`, implementando `isBanned()` e integrándolo en `JwtAuthenticationFilter` para rechazar con `403` a usuarios baneados
- [ ] Diseñar interfaz `IAccommodationListingService` para la gestión comercial: `publishListing`, `approveListing`, `rejectListing`, `finishListing`, `updateListing`, `searchListings`
- [ ] Implementar `AccommodationListingServiceImpl implements IAccommodationListingService` (valida mínimo 2 imágenes físicas asociadas a la propiedad antes de permitir que pase a `APPROVED` / `AVAILABLE`)
- [ ] Implementar `AccommodationReportServiceImpl` que, tras cada reporte persistido, cuenta las denuncias `PENDING` del `listingId`. Si supera 5 denuncias, cambia el estado del anuncio a `PENDIENTE` atómicamente
- [ ] Implementar servicios para valoraciones (`ReviewServiceImpl`) y mensajería con ofertas (`MessageServiceImpl`)
- [ ] Implementar `AccommodationListingController`, `ReviewController`, `MessageController`, `AccommodationReportController` y `AdminController` (moderación de anuncios, gestión de reportes y baneo de usuarios)

**Tareas — Tests:**

- [ ] Test unitario: intentar aprobar un listing con < 2 imágenes lanza `InsufficientImagesException`
- [ ] Test unitario: `AccommodationReportServiceImpl` activa auto-moderación atómicamente al llegar a la sexta denuncia
- [ ] Test de integración: realizar búsquedas y validar que los filtros de geolocalización, rango de precios y disponibilidad devuelven los anuncios aprobados correspondientes

**Entregable verificable:** Un propietario con una propiedad y al menos 2 imágenes puede solicitar publicar un anuncio. Tras la aprobación del administrador, el anuncio entra en estado `AVAILABLE` en el catálogo y es localizable mediante el mapa y filtros.

---

### Fase 6 — Frontend Core (Semanas 6-7, paralelo a Fases 4 y 5)

**Objetivo:** Desarrollar la interfaz web completa para usuarios y administradores, consumiendo los nuevos endpoints de forma reactiva.

**Tareas:**

- [ ] Configurar Next.js App Router con layout base, fuentes y Tailwind
- [ ] Implementar `authStore` (Zustand) con persistencia de JWT
- [ ] Crear cliente HTTP centralizado con interceptor de JWT (`lib/apiClient.ts`)
- [ ] Implementar vista `Home` con `<SearchBar />`, `<AccommodationMap />` (Leaflet) y `<AccommodationGrid />` para listar publicaciones (`listings`)
- [ ] Implementar páginas de login y registro de usuarios
- [ ] Implementar vistas de gestión física (`/accommodations` y `/accommodations/new` con subida a Cloudinary)
- [ ] Implementar creación de anuncio comercial (`/listings/new`) y vista de detalle de publicación con comentarios y formulario de ofertas
- [ ] Implementar dashboard del hogar con `<BalanceSummaryWidget />`, `<RecentExpensesList />` y `<PendingTasksList />`
- [ ] Implementar vista de gastos (prorrateo dinámico) y balances con panel de deudas simplificadas
- [ ] Implementar feed de actividad de auditoría con filtros
- [ ] Implementar panel de administración para moderación de anuncios pendientes, bandeja de reportes y control de baneos

**Entregable verificable:** Flujo visual y navegable completo de usuario y administrador en el frontend Next.js consumiendo los servicios del backend Spring Boot.

---

### Fase 7 — Servidor MCP e Integración IA (Semana 8)

**Objetivo:** Construir el servidor MCP independiente y conectar la interfaz de chat del frontend para consultas en lenguaje natural.

**Tareas — Servidor MCP (Node.js / TypeScript):**

- [ ] Inicializar proyecto con el SDK oficial de MCP
- [ ] Implementar transporte SSE (o stdio para desarrollo local)
- [ ] Implementar middleware de extracción de JWT desde el contexto JSON-RPC
- [ ] Implementar cliente HTTP tipado para llamadas al backend (`BackendApiClient`)
- [ ] Implementar tool `auditar_conflictos_hogar` con esquema de parámetros validado con Zod
- [ ] Implementar tool `analizar_balances_y_deudas` con esquema de parámetros validado con Zod
- [ ] Implementar tool `busqueda_semantica_alojamientos` con esquema de parámetros validado con Zod (para buscar anuncios comerciales mediante lenguaje natural)
- [ ] Implementar propagación de errores `403` / `401` del backend hacia el LLM

**Tareas — Frontend (Integración de Chat):**

- [ ] Implementar componente `<ChatWindow />` con historial de mensajes
- [ ] Implementar llamada al LLM con inyección del JWT en el contexto MCP
- [ ] Implementar `<ToolCallIndicator />` que muestra qué herramienta MCP está usando el modelo
- [ ] Conectar el chat a la ruta `/home/[homeId]/chat`

**Entregable verificable:** El usuario puede preguntar *"¿Quién ha tocado el gasto de la luz?"* o *"Busca alojamientos luminosos cerca de Barcelona"* y el LLM resuelve la consulta llamando a las herramientas MCP correspondientes con seguridad multi-tenant.

---

### Fase 8 — Hardening, Documentación y Despliegue (Semana 9)

**Objetivo:** Preparar el proyecto para entrega académica con calidad de producción.

**Tareas — Backend:**

- [ ] Añadir Swagger / OpenAPI 3.0 con `springdoc-openapi`: documentar todos los endpoints con ejemplos de request/response
- [ ] Revisar y aumentar cobertura de tests hasta ≥ 80 % global (JaCoCo)
- [ ] Configurar perfiles de Spring: `dev` (logs verbose, H2 para unit tests) y `prod` (PostgreSQL, logs estructurados)
- [ ] Auditar y robustecer manejo de excepciones en `@RestControllerAdvice`
- [ ] Configurar CORS para el dominio del frontend

**Tareas — Frontend:**

- [ ] Implementar manejo global de errores (`ErrorBoundary` en rutas críticas)
- [ ] Revisar accesibilidad: roles ARIA en componentes interactivos, contraste de colores
- [ ] Añadir metadata y `og:image` para SEO básico en páginas públicas
- [ ] Revisar y optimizar bundle size (dynamic imports para Leaflet y el chat)

**Tareas — Infraestructura:**

- [ ] Validar `docker-compose.yml` completo: todos los servicios arrancan sin errores
- [ ] Crear `docker-compose.prod.yml` con variables de entorno sin secretos hardcodeados
- [ ] Documentar variables de entorno en `README.md`

**Tareas — Documentación:**

- [ ] Escribir `README.md` raíz con instrucciones de instalación, levantar con Docker, ejecutar tests
- [ ] Documentar el algoritmo de simplificación de deudas con ejemplos en `docs/debt-algorithm.md`
- [ ] Documentar la arquitectura MCP y el flujo de autenticación passthrough en `docs/mcp-architecture.md`

**Entregable verificable:** Proyecto arranca con un único `docker-compose up`. Documentación de API disponible en `http://localhost:8080/swagger-ui.html`. README permite a cualquier evaluador clonar y ejecutar el proyecto en menos de 10 minutos.

---

### Resumen del Cronograma

| Semana | Fase | Módulo Principal |
|---|---|---|
| 0 | Fase 0 | Scaffolding, Docker, esquema BD |
| 1-2 | Fase 1 | Autenticación JWT y gestión de usuarios |
| 3-4 | Fase 2 | Motor financiero (TDD) — Gastos y deudas |
| 5 | Fase 3 | Auditoría inmutable y feed de actividad |
| 6 | Fase 4 | Módulo físico de alojamientos (Accommodation) e imágenes Cloudinary |
| 7 | Fase 5 | Publicación comercial (AccommodationListing) y moderación |
| 6-7 | Fase 6 | Frontend Core (desarrollado en paralelo a Fases 4 y 5) |
| 8 | Fase 7 | Servidor MCP e integración del chat IA |
| 9 | Fase 8 | Hardening, documentación y despliegue |

---

*Documento generado como plan maestro de desarrollo para TFG de desarrollador único.*
*Versión 1.1 — Arquitectura: Next.js 15 · Java Spring Boot 3.x · PostgreSQL 15 · Node.js MCP Server*