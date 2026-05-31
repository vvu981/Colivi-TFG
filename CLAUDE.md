# CLAUDE.md — Guía de Implementación del TFG
## Plataforma de Alojamiento, Gastos Compartidos y Auditoría MCP

Este documento es la guía maestra para implementar el proyecto de forma incremental y verificable.
Cada fase termina con un conjunto de comprobaciones antes de avanzar a la siguiente.

---

## Convenciones Generales

- Toda lógica de negocio vive en la capa `service`, nunca en controllers ni repositories.
- Todas las dependencias se inyectan por constructor, nunca por campo (`@Autowired` en campo está prohibido).
- Cada endpoint del backend devuelve DTOs, nunca entidades JPA directamente.
- Los repositorios de auditoría solo exponen `save` y métodos `find*`. Nunca `delete` ni `update`.
- Los tests unitarios acompañan a cada servicio en la misma fase en que se implementa.
- Las migraciones de base de datos se gestionan con Flyway (un archivo `.sql` por cambio, nunca retroceder).

---

## FASE 1 — Núcleo de Infraestructura y Seguridad

**Objetivo:** Tener un proyecto arrancando con autenticación funcional de extremo a extremo.

### 1.1 Inicialización del Proyecto Backend

- Crear proyecto Spring Boot 3.x con Java 21 mediante Spring Initializr.
- Dependencias iniciales: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`,
  `spring-boot-starter-security`, `postgresql`, `flyway-core`, `lombok`, `jjwt`.
- Configurar `application.yml` con los perfiles `dev` y `prod`. En `dev` apuntar a una base de datos
  PostgreSQL local con nombre `tfg_dev`.
- Verificar que el proyecto arranca sin errores con `./mvnw spring-boot:run`.

### 1.2 Esquema de Base de Datos — Migración inicial

- Crear el primer script Flyway: `V1__create_user_table.sql`.
- Definir la tabla `USER` con todos los campos del modelo de datos: `id` (UUID, PK),
  `nickname`, `email` (UNIQUE), `password_hash`, `first_name`, `last_name_1`, `last_name_2`,
  `phone`, `profile_pic_url`, `role` (ENUM: `USER`, `ADMIN`).
- Verificar que Flyway ejecuta la migración correctamente al arrancar.

### 1.3 Entidad y Repositorio de Usuario

- Crear la entidad JPA `UserEntity` mapeada a la tabla anterior. Usar `UUID` como tipo de PK
  generado con `@GeneratedValue(strategy = GenerationType.UUID)`.
- Crear la interfaz `UserRepository` extendiendo `JpaRepository<UserEntity, UUID>`.
  Añadir solo los métodos necesarios: `findByEmail`, `findByNickname`, `existsByEmail`.
- No añadir ningún método de borrado masivo; la eliminación de usuarios no está en el alcance.

### 1.4 Seguridad JWT

- Crear una clase `JwtService` (un único método para generar token, otro para extraerlo y validarlo).
- Crear el filtro `JwtAuthenticationFilter` que intercepta cada request, extrae el token del header
  `Authorization: Bearer ...`, lo valida y carga el `SecurityContext`.
- Configurar `SecurityFilterChain` en una clase `SecurityConfig`:
    - Rutas públicas: `POST /api/v1/auth/**`, `GET /api/v1/accommodations/**`.
    - Todo lo demás requiere autenticación.
- El `UserDetailsService` cargará usuarios por email desde `UserRepository`.

### 1.5 Endpoints de Autenticación

- `POST /api/v1/auth/register` — Recibe `RegisterRequestDTO` (nickname, email, password, nombre,
  apellidos, teléfono). El servicio hashea la contraseña con BCrypt antes de persistir.
  Devuelve el token JWT y los datos básicos del usuario creado.
- `POST /api/v1/auth/login` — Recibe `LoginRequestDTO` (email, password). Autentica contra la BD,
  devuelve token JWT.
- Crear `AuthController`, `AuthService` (con su interfaz `IAuthService`), los DTOs de entrada y
  el `AuthResponseDTO` de salida.

### 1.6 Endpoint de Perfil Propio

- `GET /api/v1/users/me` — Devuelve el perfil del usuario autenticado. Extraer el `UUID` del
  usuario desde el `SecurityContext`, no del request body.

### ✅ Comprobaciones de Fase 1

- [ ] `./mvnw test` pasa sin errores.
- [ ] Flyway crea la tabla `USER` al arrancar.
- [ ] `POST /auth/register` crea un usuario; la contraseña en BD está hasheada, nunca en claro.
- [ ] `POST /auth/login` devuelve un JWT válido.
- [ ] `GET /users/me` con el JWT retorna los datos del usuario; sin JWT retorna 401.
- [ ] `GET /users/me` con un JWT manipulado retorna 401.

---

## FASE 2 — Módulo de Hogar y Motor Financiero

**Objetivo:** Crear hogares, gestionar miembros, registrar gastos y calcular balances correctamente.

### 2.1 Migraciones de Tablas del Módulo Hogar

- `V2__create_hogar_tables.sql`: tablas `HOGAR` y `HOGAR_MEMBER` (clave compuesta `hogar_id` +
  `user_id`). Incluir columna `is_admin` (BOOLEAN) en `HOGAR_MEMBER` para marcar al creador.
- `V3__create_expense_tables.sql`: tablas `EXPENSE` y `EXPENSE_AFFECTED`.
    - `EXPENSE`: id, `hogar_id` (FK), `payer_id` (FK a USER), `amount` (NUMERIC(10,2)),
      `description`, `created_at`.
    - `EXPENSE_AFFECTED`: `expense_id` (FK) + `user_id` (FK), clave primaria compuesta.
- `V4__create_task_table.sql`: tabla `TASK` con id, `hogar_id` (FK), `title`, `description`,
  `is_completed` (BOOLEAN, DEFAULT false), `assigned_to` (FK a USER, nullable).

### 2.2 Entidades y Repositorios

- Crear entidades JPA: `HogarEntity`, `HogarMemberEntity` (con clave embebida `HogarMemberId`),
  `ExpenseEntity`, `ExpenseAffectedEntity`, `TaskEntity`.
- Repositorios: `HogarRepository`, `HogarMemberRepository`, `ExpenseRepository`,
  `ExpenseAffectedRepository`, `TaskRepository`.

### 2.3 Gestión de Hogar

- `POST /api/v1/hogares` — Crea un hogar. El usuario autenticado se convierte automáticamente en
  miembro con `is_admin = true`.
- `POST /api/v1/hogares/{hogarId}/members` — Invita a un usuario por email o nickname.
  Solo el admin del hogar puede ejecutarlo.
- `DELETE /api/v1/hogares/{hogarId}/members/{userId}` — Elimina un miembro. Restricción: no se
  puede eliminar si el usuario tiene deudas pendientes (balance negativo en el hogar). El servicio
  debe verificar esto antes de proceder.
- `GET /api/v1/hogares/{hogarId}` — Devuelve datos del hogar y lista de miembros. Solo accesible
  para miembros del hogar.
- Implementar un componente `HogarAuthorizationService` que centralice las comprobaciones de
  pertenencia y rol dentro de un hogar. Los demás servicios lo reutilizan en lugar de duplicar la lógica.

### 2.4 Gestión de Gastos

- `POST /api/v1/hogares/{hogarId}/expenses` — Crea un gasto. El DTO de entrada incluye:
  `amount`, `description`, `payerId`, lista de `affectedUserIds`.
  Validaciones en el servicio:
    - El pagador y todos los afectados deben ser miembros del hogar.
    - La lista de afectados no puede estar vacía.
    - El monto debe ser mayor que 0.
- `GET /api/v1/hogares/{hogarId}/expenses` — Lista todos los gastos del hogar, paginados.
- `PUT /api/v1/hogares/{hogarId}/expenses/{expenseId}` — Edita un gasto. Solo el pagador
  o el admin del hogar puede editarlo.
- `DELETE /api/v1/hogares/{hogarId}/expenses/{expenseId}` — Elimina un gasto.

### 2.5 Motor de Balances y Simplificación de Deudas

Este es el componente más crítico de la aplicación. Implementarlo con especial cuidado y tests exhaustivos.

- Crear la interfaz `DebtSimplifierEngine` con un único método:
  `List<DebtTransactionDTO> simplify(List<MemberBalanceDTO> balances)`.
- Implementar `TransitDebtSimplifier` que aplique el algoritmo de tránsito:
    1. Calcular el balance neto de cada miembro (suma de lo que pagó menos su parte proporcional
       en todos los gastos del hogar).
    2. Separar en dos listas: deudores (balance negativo) y acreedores (balance positivo).
    3. Iterar emparejando al mayor deudor con el mayor acreedor, generando transacciones directas
       hasta que todos los balances sean cero. Este proceso elimina intermediarios.
- `GET /api/v1/hogares/{hogarId}/balances` — Devuelve:
    - Lista de miembros con su balance neto (positivo o negativo, con indicador de color).
    - Lista simplificada de transacciones necesarias para saldar todas las deudas.

### 2.6 Gestión de Tareas

- `POST /api/v1/hogares/{hogarId}/tasks` — Crea una tarea.
- `GET /api/v1/hogares/{hogarId}/tasks` — Lista tareas del hogar.
- `PATCH /api/v1/hogares/{hogarId}/tasks/{taskId}/toggle` — Conmuta el estado
  `is_completed` de la tarea.
- `PUT /api/v1/hogares/{hogarId}/tasks/{taskId}` — Edita título, descripción o asignado.
- `DELETE /api/v1/hogares/{hogarId}/tasks/{taskId}` — Elimina una tarea.

### ✅ Comprobaciones de Fase 2

- [ ] Tests unitarios del `TransitDebtSimplifier` con al menos estos escenarios:
    - Hogar de 2 personas: A paga todo, B debe la mitad.
    - Hogar de 3: A debe a B, B debe a C → resultado: A paga directamente a C.
    - Hogar de 4 con múltiples gastos cruzados → verificar que el número de transacciones
      resultantes es siempre menor o igual que N-1 (siendo N el número de miembros).
- [ ] Crear un hogar, invitar a dos usuarios, registrar 3 gastos con distintos pagadores
  y afectados, y verificar que los balances son matemáticamente correctos.
- [ ] Intentar eliminar un miembro con deuda pendiente → recibir error 409 Conflict.
- [ ] Solo el admin puede invitar y expulsar miembros → verificar 403 en caso contrario.

---

## FASE 3 — Sistema de Auditoría Inmutable

**Objetivo:** Registrar automáticamente todos los cambios en gastos y tareas con snapshots antes/después,
garantizando que esos registros nunca puedan ser modificados ni borrados.

### 3.1 Migración de la Tabla de Auditoría

- `V5__create_audit_log_table.sql`: tabla `AUDIT_SNAPSHOT_LOG`.
    - Columnas: `id` (UUID, PK), `user_id` (FK a USER), `entity_type` (VARCHAR: `EXPENSE`, `TASK`),
      `entity_id` (UUID), `action_type` (ENUM: `CREATE`, `UPDATE`, `DELETE`),
      `snapshot_before` (JSONB, nullable), `snapshot_after` (JSONB, nullable),
      `server_timestamp` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()).
    - Crear un trigger PostgreSQL `prevent_audit_modification` que ejecute `RAISE EXCEPTION`
      ante cualquier `UPDATE` o `DELETE` sobre esta tabla. Esto es la primera línea de defensa.

### 3.2 Entidad y Repositorio de Auditoría

- Entidad `AuditSnapshotLogEntity` mapeada a la tabla anterior.
    - Anotarla con `@Immutable` de Hibernate para que el ORM nunca intente hacer flush de cambios.
- `AuditLogRepository`: solo exponer `save`, `findByEntityId`, `findByHogarId` (con JOIN),
  y métodos de paginación. **No heredar** `deleteById` ni ningún método destructivo de
  `JpaRepository`. Usar `@Repository` sobre una interfaz personalizada que extienda
  `Repository<AuditSnapshotLogEntity, UUID>` (la versión mínima de Spring Data).
- Añadir en `AuditLogService` un método anotado con `@PreRemove` y `@PreUpdate` que lance una
  excepción `AuditImmutabilityViolationException` si algún código Java intenta persistir un cambio.
  Esta es la segunda línea de defensa (a nivel de aplicación).

### 3.3 Interceptor de Auditoría

- Crear `AuditInterceptorService`. Este servicio es transversal y será llamado por los servicios
  de `Expense` y `Task` en cada operación de escritura.
- Su responsabilidad: recibir el estado anterior (objeto antes de modificar) y el estado posterior
  (objeto tras modificar), serializarlos a JSON (usando Jackson `ObjectMapper`), y persistir el
  registro en `AUDIT_SNAPSHOT_LOG` con el `userId` del usuario autenticado y el timestamp del servidor.
- El timestamp **siempre** se toma con `Instant.now()` en el servidor; nunca se acepta del cliente.
- Integrar las llamadas al interceptor dentro de los métodos `create`, `update` y `delete` de
  `ExpenseService` y `TaskService`. Usar `@Transactional` para que el snapshot y el cambio
  principal se persistan en la misma transacción.

### 3.4 Feed de Actividad Cronológica

- `GET /api/v1/audit/hogar/{hogarId}?page=0&size=20` — Devuelve los registros de auditoría
  del hogar ordenados por `server_timestamp` DESC, paginados.
- El DTO de respuesta (`AuditFeedItemDTO`) debe incluir: timestamp, tipo de acción, tipo de
  entidad, nickname del autor del cambio, y un campo `humanReadableSummary` (String) que el
  servicio construye comparando `snapshotBefore` y `snapshotAfter` en lenguaje natural.
  Ejemplos: `"Carlos modificó el monto del gasto 'Supermercado' de 45.00€ a 52.50€"`,
  `"Ana marcó como completada la tarea 'Limpiar baño'"`.

### ✅ Comprobaciones de Fase 3

- [ ] Crear un gasto → verificar que existe exactamente 1 registro en `AUDIT_SNAPSHOT_LOG`
  con `action_type = CREATE`, `snapshot_before = null` y `snapshot_after` con los datos del gasto.
- [ ] Editar el monto del gasto → verificar un nuevo registro `UPDATE` con ambos snapshots poblados.
- [ ] Eliminar el gasto → verificar un registro `DELETE` con `snapshot_after = null`.
- [ ] Intentar ejecutar directamente en PostgreSQL: `DELETE FROM audit_snapshot_log WHERE id = '...'`
  → el trigger debe abortar la operación con excepción.
- [ ] Verificar que el feed cronológico devuelve los ítems en orden correcto y el
  `humanReadableSummary` es legible.
- [ ] `./mvnw test` sigue pasando.

---

## FASE 4 — Módulo de Alojamiento y Marketplace

**Objetivo:** Gestión completa de anuncios de alojamiento con flujo de aprobación, valoraciones y mensajería.

### 4.1 Migraciones de Tablas del Módulo Alojamiento

- `V6__create_accommodation_tables.sql`: tablas `ACCOMMODATION` y `ACCOMMODATION_IMAGE`.
    - `ACCOMMODATION`: id, `owner_id` (FK), `title`, `description` (TEXT), `price_per_month`
      (NUMERIC), `address`, `locality`, `city`, `country`, `latitude`, `longitude`,
      `status` (ENUM: `PENDING`, `ACTIVE`, `REJECTED`, `FINISHED`).
    - `ACCOMMODATION_IMAGE`: id, `accommodation_id` (FK), `image_url` (TEXT).
    - Crear índice compuesto `idx_accommodation_city_price` sobre `(city, price_per_month)`.
    - Crear índices B-Tree sobre `latitude` y `longitude`.
- `V7__create_review_tables.sql`: tabla `ACCOMMODATION_REVIEW` y `USER_REVIEW`.
    - `ACCOMMODATION_REVIEW`: id, `author_id` (FK), `accommodation_id` (FK), `rating` (INT CHECK
      BETWEEN 1 AND 5), `comment` (TEXT, nullable). Restricción UNIQUE sobre
      `(author_id, accommodation_id)` para impedir valoraciones duplicadas del mismo usuario.
    - `USER_REVIEW`: id, `reviewer_id` (FK), `reviewed_user_id` (FK), `rating`, `comment`.
      Restricción para que un usuario no pueda valorarse a sí mismo.
- `V8__create_message_tables.sql`: tablas `CONVERSATION` y `MESSAGE`.
    - `CONVERSATION`: id, `accommodation_id` (FK), `sender_id` (FK), `owner_id` (FK), `created_at`.
      Restricción UNIQUE sobre `(accommodation_id, sender_id)`.
    - `MESSAGE`: id, `conversation_id` (FK), `author_id` (FK), `content` (TEXT), `sent_at`,
      `is_offer` (BOOLEAN DEFAULT false), `offer_amount` (NUMERIC, nullable).

### 4.2 Endpoints Públicos (sin autenticación)

- `GET /api/v1/accommodations` — Lista anuncios con `status = ACTIVE`. Parámetros query opcionales:
  `city`, `minPrice`, `maxPrice`. Solo devuelve anuncios con al menos 2 imágenes asociadas.
- `GET /api/v1/accommodations/{id}` — Detalle de un anuncio activo: datos completos, imágenes,
  valoraciones y rating medio.
- `GET /api/v1/accommodations/reviews?city={city}` — Devuelve valoraciones y comentarios de
  alojamientos de una ciudad (usado por el servidor MCP para búsqueda semántica).

### 4.3 Endpoints Autenticados — Propietario

- `POST /api/v1/accommodations` — Crea un anuncio en estado `PENDING`. El `owner_id` se extrae
  del JWT, nunca del body. Requiere al menos título, descripción, precio, dirección completa
  y coordenadas.
- `POST /api/v1/accommodations/{id}/images` — Añade URLs de imágenes al anuncio. Solo el
  propietario del anuncio puede añadirlas.
- `PUT /api/v1/accommodations/{id}` — Edita un anuncio propio. No permite editar el `status`
  directamente (eso es competencia del admin).
- `DELETE /api/v1/accommodations/{id}` — El propietario puede retirar su propio anuncio
  (cambia status a `FINISHED`, no elimina el registro).

### 4.4 Endpoints Autenticados — Administrador

- `GET /api/v1/admin/accommodations/pending` — Lista todos los anuncios en estado `PENDING`.
- `POST /api/v1/admin/accommodations/{id}/approve` — Aprueba un anuncio. El servicio verifica
  que tenga al menos 2 imágenes antes de cambiar el estado a `ACTIVE`. Si no, devuelve 422
  Unprocessable Entity con mensaje descriptivo.
- `POST /api/v1/admin/accommodations/{id}/reject` — Rechaza un anuncio, cambia estado a `REJECTED`.
  Opcionalmente acepta un campo `reason` en el body.
- `DELETE /api/v1/admin/accommodations/{id}` — Eliminación definitiva (solo admin, para moderación).
- `DELETE /api/v1/admin/reviews/{id}` — Elimina una valoración inapropiada.

### 4.5 Valoraciones

- `POST /api/v1/accommodations/{id}/reviews` — Publica una valoración sobre un alojamiento.
  El servicio valida que el autor no sea el propietario del alojamiento y que no haya
  valorado ya ese alojamiento.
- `POST /api/v1/users/{userId}/reviews` — Publica una valoración sobre otro usuario.
  El servicio valida que `reviewerId != reviewedUserId`.

### 4.6 Mensajería y Ofertas

- `POST /api/v1/accommodations/{id}/conversations` — Inicia o recupera una conversación entre
  el usuario autenticado y el propietario del anuncio. Si ya existe `CONVERSATION` con ese par
  `(accommodation_id, sender_id)`, devuelve la existente.
- `GET /api/v1/conversations/{conversationId}/messages` — Lista mensajes de la conversación.
  Solo los participantes pueden acceder.
- `POST /api/v1/conversations/{conversationId}/messages` — Envía un mensaje. Si `isOffer = true`,
  incluir `offerAmount`. El servicio valida que `offerAmount > 0` cuando `isOffer = true`.

### ✅ Comprobaciones de Fase 4

- [ ] Un usuario no autenticado puede listar y ver anuncios activos, pero no puede crearlos.
- [ ] Crear un anuncio con 0 o 1 imagen e intentar aprobarlo → recibir 422.
- [ ] Añadir 2 imágenes y aprobar → el anuncio aparece en el listado público.
- [ ] Un usuario no puede valorar su propio alojamiento → recibir 400 o 403.
- [ ] Un usuario no puede enviar dos valoraciones al mismo alojamiento → recibir 409.
- [ ] Un usuario no admin no puede acceder a `/admin/**` → recibir 403.
- [ ] Verificar que los índices de ciudad y precio funcionan (consultar el `EXPLAIN ANALYZE`
  de la query de filtrado).

---

## FASE 5 — Frontend Next.js

**Objetivo:** Interfaz de usuario completa, conectada al backend, con mapa interactivo y chat.

### 5.1 Inicialización del Proyecto Frontend

- Crear proyecto Next.js 15 con TypeScript y App Router: `npx create-next-app@latest`.
- Instalar dependencias clave: `axios` o `fetch` nativo, `zustand` (gestión de estado global),
  `react-hook-form` + `zod` (formularios y validación), `leaflet` o `mapbox-gl` (mapas),
  librería de componentes UI (Shadcn/ui recomendado por compatibilidad con App Router).
- Configurar un cliente HTTP centralizado en `lib/apiClient.ts` que inyecte automáticamente
  el JWT en el header `Authorization` de cada request autenticada.
- Configurar `middleware.ts` de Next.js para proteger rutas privadas (redirigir a `/login` si
  no hay token).

### 5.2 Páginas y Rutas

Estructura de rutas con App Router:

```
/                        → Página principal: buscador, filtros, lista y mapa de anuncios
/login                   → Formulario de login
/register                → Formulario de registro
/accommodations/[id]     → Detalle de anuncio con galería, mapa, valoraciones y chat
/dashboard               → Panel privado del usuario autenticado
/dashboard/hogares       → Lista de hogares del usuario
/dashboard/hogares/[id]  → Vista interna del hogar: gastos, tareas, balances, feed de actividad
/dashboard/hogares/nuevo → Crear hogar
/dashboard/mensajes      → Bandeja de conversaciones
/admin                   → Panel de administración (solo rol ADMIN)
/admin/pending           → Lista de anuncios pendientes de aprobación
```

### 5.3 Componentes Clave

- `AccommodationCard` — Tarjeta de anuncio con imagen, precio, ciudad y rating medio.
- `AccommodationMap` — Mapa interactivo con marcadores. Al hacer clic en un marcador, mostrar
  un popup con la `AccommodationCard`. Los marcadores se actualizan reactivamente al cambiar los filtros.
- `FilterBar` — Inputs de ciudad, precio mínimo y máximo. Al cambiar, actualiza la query sin
  recargar la página (parámetros en la URL con `useSearchParams`).
- `ExpenseForm` — Formulario para crear/editar un gasto: monto, descripción, selector de pagador
  y selector multi-selección de afectados (solo miembros del hogar actual).
- `BalanceDashboard` — Muestra los balances de cada miembro con círculo verde/rojo y la lista
  de transacciones simplificadas recomendadas.
- `AuditFeed` — Lista cronológica de eventos del hogar con el `humanReadableSummary`.
- `ChatWindow` — Ventana de mensajería con soporte para mensajes normales y ofertas económicas.
- `AiChatPanel` — Panel lateral de chat con el LLM conectado al servidor MCP. Distinguible
  visualmente del chat de mensajería de alojamientos.

### 5.4 Autenticación en el Frontend

- Guardar el JWT en `localStorage` (o cookie HttpOnly si se implementa SSR completo; priorizar
  la opción más sencilla primero).
- Crear un `AuthContext` (o store de Zustand) que exponga `user`, `token`, `login()`, `logout()`.
- Al montar la app, intentar recuperar el perfil con `GET /users/me` para validar el token guardado.

### 5.5 Mapa Interactivo

- Usar `Leaflet` con tiles de OpenStreetMap (gratuito, sin API key).
- El mapa se inicializa centrado en España por defecto.
- Los marcadores se generan a partir de los campos `latitude` y `longitude` de cada anuncio.
- Al aplicar un filtro, se hace fetch de los nuevos resultados y se actualiza el estado de marcadores.
- El mapa NO se monta en SSR (usar `dynamic` de Next.js con `{ ssr: false }` para el componente
  del mapa, ya que Leaflet requiere `window`).

### ✅ Comprobaciones de Fase 5

- [ ] Un usuario no autenticado ve la página principal con anuncios y el mapa. No ve el dashboard.
- [ ] Filtrar por ciudad actualiza la lista y los marcadores del mapa simultáneamente.
- [ ] El flujo completo de registro → login → crear hogar → invitar miembro → crear gasto funciona
  sin errores de consola ni errores de red.
- [ ] Los círculos de balance aparecen en verde/rojo según el saldo de cada miembro.
- [ ] El feed de auditoría muestra los cambios en orden cronológico inverso.
- [ ] Un usuario con rol ADMIN ve el enlace al panel de administración; un usuario normal no lo ve.
- [ ] Lighthouse score: Performance > 80, Accessibility > 90 en la página principal.

---

## FASE 6 — Servidor MCP e Integración con LLM

**Objetivo:** Exponer las capacidades analíticas del sistema a través de MCP para que el LLM pueda
razonar sobre los datos internos de la aplicación.

### 6.1 Inicialización del Servidor MCP

- Crear un proyecto Node.js independiente (en `/mcp-server`) con TypeScript.
- Instalar: `@modelcontextprotocol/sdk`, `axios`, `zod`, `dotenv`.
- Configurar `tsconfig.json` para target ES2022, módulo CommonJS.
- El servidor se comunica con el backend a través de variables de entorno:
  `BACKEND_BASE_URL`, `MCP_SERVICE_JWT` (un token JWT de larga duración generado para el
  servicio MCP, con un rol especial `SERVICE_ACCOUNT` que el backend reconocerá).

### 6.2 Autenticación del Servidor MCP contra el Backend

- En el backend Spring Boot, crear un nuevo valor en el ENUM de roles: `SERVICE`.
- Crear un endpoint de generación de token de servicio `POST /api/v1/auth/service-token`
  accesible solo para usuarios con rol `ADMIN`, que genera un JWT de muy larga duración
  (30 días) para el rol `SERVICE`.
- El servidor MCP almacena este token en su `.env` y lo incluye en todas sus peticiones al backend.
- En la `SecurityConfig` del backend, los endpoints consumidos por el MCP requieren el rol
  `SERVICE` o `ADMIN`.

### 6.3 Implementación de las Tres Herramientas MCP

Cada herramienta sigue la misma estructura: definición del esquema `zod` → handler asíncrono
→ llamada HTTP al backend → formateo de la respuesta para el LLM.

**Herramienta `auditar_conflictos_hogar`:**
- Parámetros: `hogarId` (string), `limite` (number, opcional, default 50).
- Llama a `GET /api/v1/audit/hogar/{hogarId}?size={limite}`.
- Formatea la respuesta como una secuencia cronológica de eventos con autoría y resumen legible.
- Añadir instrucciones en la descripción de la herramienta para que el LLM use esta herramienta
  cuando el usuario haga preguntas del tipo "¿quién cambió X?", "¿cuándo se modificó Y?".

**Herramienta `analizar_balances_y_deudas`:**
- Parámetros: `hogarId` (string).
- Llama a `GET /api/v1/hogares/{hogarId}/balances`.
- Formatea la respuesta indicando claramente quién debe a quién y cuánto, y la lista de
  transferencias simplificadas. El LLM usará esto para dar recomendaciones de liquidación.

**Herramienta `busqueda_semantica_alojamientos`:**
- Parámetros: `criterioSemantico` (string), `ciudad` (string).
- Llama a `GET /api/v1/accommodations/reviews?city={ciudad}`.
- Entrega al LLM el conjunto de anuncios con sus descripciones y comentarios de valoraciones.
  El LLM actúa como filtro cualitativo para seleccionar los más relevantes según el criterio.

### 6.4 Integración del Chat en el Frontend

- En el panel `AiChatPanel`, el frontend NO llama directamente al servidor MCP.
  La comunicación es: `Frontend → API de Anthropic/OpenAI → Servidor MCP`.
- Configurar el SDK del LLM en el frontend (o en una API Route de Next.js para no exponer
  la API key en el cliente) para que use el servidor MCP como proveedor de herramientas.
- El `AiChatPanel` pasa el `hogarId` activo como contexto inicial del sistema al LLM para
  que las herramientas se ejecuten sobre el hogar correcto sin que el usuario tenga que
  especificarlo en cada pregunta.
- Mostrar en la UI un indicador visual cuando el LLM está invocando una herramienta
  (spinner con texto "Consultando datos del hogar...").

### ✅ Comprobaciones de Fase 6

- [ ] El servidor MCP arranca sin errores: `npm run dev`.
- [ ] Usando el cliente MCP inspector, las tres herramientas aparecen con sus esquemas correctos.
- [ ] Llamar manualmente a `auditar_conflictos_hogar` con un `hogarId` válido devuelve
  los registros de auditoría formateados.
- [ ] En el chat del frontend, preguntar "¿Cuánto le debo a cada uno en mi hogar?" desencadena
  la herramienta `analizar_balances_y_deudas` y el LLM responde con datos reales.
- [ ] Preguntar "Busco un piso tranquilo con buen casero en Sevilla" desencadena
  `busqueda_semantica_alojamientos` y el LLM cruza los comentarios con el criterio.
- [ ] El servidor MCP no accede directamente a la base de datos bajo ninguna circunstancia.
  Verificar que no tiene dependencia de `pg` ni ningún cliente de base de datos.

---

## FASE 7 — Hardening, Tests y Preparación para Entrega

**Objetivo:** Asegurar la calidad, robustez y documentación del proyecto antes de la defensa.

### 7.1 Cobertura de Tests Backend

- Tests unitarios (JUnit 5 + Mockito):
    - `TransitDebtSimplifier`: mínimo 8 casos de prueba incluyendo casos borde (hogar de 1 persona,
      todos a cero, deudas circulares complejas).
    - `AuditInterceptorService`: verificar que se generan snapshots correctos para cada operación.
    - `AccommodationService`: verificar la validación de 2 imágenes mínimas al aprobar.
- Tests de integración (Spring Boot Test + Testcontainers para PostgreSQL):
    - Flujo completo de registro → login → crear hogar → gasto → balance.
    - Verificar que el trigger de inmutabilidad de auditoría funciona desde el test de integración.
    - Flujo de aprobación de anuncio por el administrador.

### 7.2 Validación y Manejo de Errores

- Revisar que todos los endpoints tienen validación con Bean Validation (`@NotNull`, `@Min`,
  `@Size`, etc.) en los DTOs de entrada.
- Crear un `GlobalExceptionHandler` con `@RestControllerAdvice` que capture:
    - `MethodArgumentNotValidException` → 400 Bad Request con lista de errores de campo.
    - `AccessDeniedException` → 403 Forbidden.
    - `EntityNotFoundException` → 404 Not Found.
    - `AuditImmutabilityViolationException` → 500 Internal Server Error con mensaje descriptivo.
    - Excepciones no controladas → 500 genérico sin stack trace en el body (seguridad).

### 7.3 Configuración CORS y Variables de Entorno

- Configurar CORS en Spring Boot para aceptar peticiones exclusivamente desde el origen del
  frontend (`http://localhost:3000` en dev, la URL de producción en prod).
- Asegurarse de que ninguna credencial (claves JWT, credenciales de BD, API keys del LLM)
  está hardcodeada en el código. Todo debe venir de variables de entorno o archivos `.env`
  excluidos del control de versiones.
- Añadir al `.gitignore`: `.env`, `application-prod.yml`, `*.jks`, cualquier archivo de secretos.

### 7.4 Docker Compose para Entorno de Desarrollo

- Crear `docker-compose.yml` en la raíz del monorepo con servicios:
    - `db`: imagen `postgres:16`, con volumen persistente, variables de entorno para usuario/pass/bd.
    - `backend`: build desde `./backend`, depende de `db`, expone puerto 8080.
    - `frontend`: build desde `./frontend`, expone puerto 3000.
    - `mcp-server`: build desde `./mcp-server`, depende de `backend`, expone puerto 3001.
- Añadir un `README.md` en la raíz con instrucciones para arrancar todo con `docker compose up`.

### 7.5 Documentación de la API

- Añadir `springdoc-openapi-starter-webmvc-ui` al backend.
- Documentar cada endpoint con `@Operation`, `@ApiResponse` y `@Parameter` donde sea necesario.
- Verificar que Swagger UI es accesible en `http://localhost:8080/swagger-ui.html` y que
  permite ejecutar peticiones autenticadas (configurar el botón "Authorize" con JWT).

### ✅ Comprobaciones Finales de Fase 7

- [ ] `./mvnw test` pasa al 100%. Cobertura de líneas en servicios clave > 80%.
- [ ] `docker compose up` levanta todo el sistema desde cero sin intervención manual.
- [ ] Swagger UI lista todos los endpoints agrupados por módulo con descripción.
- [ ] Ninguna credencial aparece en el historial de Git (`git log -S "password"` no devuelve hits).
- [ ] El trigger de la BD impide modificar logs de auditoría incluso con acceso directo a psql.
- [ ] Flujo completo de demo funciona: registro → hogar → gastos → balances → chat MCP →
  búsqueda de alojamiento → valoración → aprobación de anuncio por admin.

---

## Notas Arquitectónicas Importantes

**Sobre la inmutabilidad de la auditoría:** La defensa más fuerte es el trigger de PostgreSQL
(Fase 3.1). El bloqueo a nivel de Spring Boot es una segunda capa defensiva. Ambas deben coexistir.

**Sobre el algoritmo de deudas:** El algoritmo de tránsito no siempre produce el mínimo absoluto
de transacciones (ese problema es NP-hard), pero es correcto, rápido y fácil de explicar en la
defensa del TFG. Es suficiente y adecuado para el alcance del proyecto.

**Sobre el servidor MCP:** El aislamiento estricto (MCP → Backend → BD) es un requisito
arquitectónico, no una preferencia. No añadir acceso directo a la base de datos en el servidor
MCP aunque parezca más conveniente. La trazabilidad y el control de acceso dependen de este diseño.

**Sobre el orden de implementación:** No empezar el frontend hasta que los endpoints de Fases 1-3
estén testados. No empezar el MCP hasta que los endpoints de Fase 4 estén listos. Respetar el
orden elimina el riesgo de construir una UI sobre un backend incompleto.