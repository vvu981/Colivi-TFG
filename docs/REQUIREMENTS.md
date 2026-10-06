# Catálogo de Requisitos Funcionales (RF) - Plataforma Colivi

Documento formal de especificación de Requisitos Funcionales del sistema software conforme a las directrices de la metodología de desarrollo y estándares de ingeniería del software (IEEE 830). Cada requisito se encuentra estrictamente implementado y trazado contra los controladores del backend (`Colivi-backend`), las interfaces del cliente (`Colivi-frontend`), los modelos de persistencia (`Flyway / PostgreSQL`), el servidor de herramientas (`mcp-server`) y el Diagrama de Casos de Uso (`docs/DCU.md`).

---

## 1. Subsistema de Identidad, Autenticación y Gestión de Perfiles

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Registro Local con Credenciales | Usuario Invitado | Permite crear una nueva cuenta mediante nombre, apellidos, correo electrónico único y contraseña con cifrado seguro BCrypt. | Validación de formato de email, contraseña robusta y asignación de rol inicial `USER`. |
| **RF-02** | Autenticación Local (Inicio de Sesión) | Usuario Registrado | Valida las credenciales aportadas por el usuario y emite un par de tokens criptográficos JWT (Access Token de corta duración y Refresh Token). | Verificación de cuenta activa (no suspendida ni eliminada) y control de versión de tokens. |
| **RF-03** | Autenticación Federada con Google OAuth | Usuario Invitado / Registrado | Permite iniciar sesión o registrarse automáticamente mediante la verificación en backend del ID Token emitido por Google OAuth 2.0. | Sincronización de email verificado y descarga opcional del avatar oficial de Google. |
| **RF-04** | Renovación de Sesión (Refresh Token) | Usuario Autenticado | Emite un nuevo Access Token válido a partir de un Refresh Token vigente sin forzar al usuario a reintroducir sus credenciales. | Rotación de credenciales y revocación inmediata si el token ha expirado o la versión de sesión ha cambiado. |
| **RF-05** | Cierre de Sesión Seguro (Logout) | Usuario Autenticado | Invalida los tokens de la sesión activa en el cliente y el servidor, concluyendo el acceso de forma segura. | Limpieza de cookies seguras y desconexión de canales de tiempo real. |
| **RF-06** | Solicitud de Restablecimiento de Contraseña | Usuario Invitado | Permite solicitar la recuperación de acceso mediante la introducción del correo electrónico registrado, emitiendo un token temporal de un solo uso por email. | Generación de token criptográfico temporal con expiración de 15 minutos en Mailpit/SMTP. |
| **RF-07** | Confirmación de Restablecimiento de Contraseña | Usuario Invitado | Permite fijar una nueva contraseña en el sistema validando la vigencia del token de recuperación recibido por correo. | Verificación de firma y expiración del token; actualización de hash BCrypt e invalidación del token consumido. |
| **RF-08** | Solicitud de Reactivación de Cuenta | Usuario Invitado | Permite a un usuario cuya cuenta se encuentra en estado de borrado lógico solicitar su restauración mediante el envío de un token a su correo. | Validación de existencia de cuenta con marca `deletedAt` activa. |
| **RF-09** | Confirmación de Reactivación de Cuenta | Usuario Invitado | Restablece el acceso y operatividad completa de una cuenta previamente dada de baja al aportar el token de reactivación válido. | Eliminación de la marca `deletedAt` y reactivación de relaciones vigentes. |
| **RF-10** | Consulta de Perfil Propio | Usuario Autenticado | Permite al usuario autenticado obtener el detalle completo de su ficha de identidad (`/api/v1/users/me`), incluyendo datos sensibles y roles. | Requiere token JWT válido; retorna datos personales, teléfono, correo y estado. |
| **RF-11** | Consulta de Perfil Público de Terceros | Usuario Autenticado / Invitado | Permite visualizar la ficha pública de otro usuario (nombre, apodo, foto de perfil y fecha de registro), excluyendo información privada o sensible. | Filtrado estricto de DTO público; omisión de teléfono, correo y contraseñas. |
| **RF-12** | Actualización de Información Personal (No Sensible) | Usuario Autenticado | Permite modificar el nombre de pila, apellidos, apodo y número de teléfono de contacto sin requerir reautenticación. | Validación de formato numérico internacional E.164 y restricción de unicidad. |
| **RF-13** | Actualización de Credenciales y Correo (Sensible) | Usuario Autenticado | Permite modificar la contraseña actual o el correo electrónico exigiendo la confirmación de la contraseña previa como salvaguarda de seguridad. | Verificación contra el hash actual antes de persistir la nueva credencial. |
| **RF-14** | Subida y Actualización de Avatar | Usuario Autenticado | Permite cargar una fotografía de perfil almacenándola en la CDN Cloudinary y vinculando la URL pública en el registro del usuario. | Validación de formato de imagen (JPEG, PNG, WEBP) y límite de tamaño máximo. |
| **RF-15** | Baja Voluntaria de Cuenta (Borrado Lógico) | Usuario Autenticado | Permite al usuario eliminar su propia cuenta, anonimizando u ocultando su presencia (`deletedAt`) sin vulnerar la integridad referencial histórica. | Comprobación de que no es administrador único con miembros activos en su hogar. |
| **RF-16** | Búsqueda y Listado de Usuarios (Administración) | Administrador del Sistema | Permite a la administración filtrar, paginar y buscar cuentas de usuario por apodo, correo, rol o estado de penalización. | Exclusivo para usuarios con autoridad `UserRole.ADMIN`. |
| **RF-17** | Suspensión y Bloqueo de Cuenta (Ban) | Administrador del Sistema | Permite suspender temporal o indefinidamente el acceso de un usuario infractor, registrando motivo, fecha y expiración. | El usuario bloqueado es rechazado en tiempo de autenticación por el filtro de seguridad. |
| **RF-18** | Levantamiento de Suspensión (Unban) | Administrador del Sistema | Permite revocar la sanción de un usuario baneado, restableciendo de inmediato su capacidad de iniciar sesión y operar. | Limpieza de los campos `bannedAt`, `bannedUntil` y `banReason`. |
| **RF-19** | Promoción de Privilegios de Administración | Administrador del Sistema | Permite a un administrador global otorgar o revocar el rol de administración a otra cuenta del sistema. | Protección contra auto-degradación de rol del propio administrador ejecutor. |

---

## 2. Subsistema de Inmuebles, Anuncios y Exploración Cartográfica

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-20** | Registro de Inmueble Físico Base (Accommodation) | Anfitrión | Permite dar de alta una propiedad física en el inventario del propietario especificando dirección, habitaciones, baños, metros cuadrados y comodidades. | El inmueble físico existe independientemente de si tiene anuncios publicados o no. |
| **RF-21** | Modificación de Inmueble Base | Anfitrión | Permite al propietario editar las características físicas y estructurales de su propiedad registrada. | Control de concurrencia optimista mediante campo `@Version`. |
| **RF-22** | Gestión de Galería Fotográfica del Inmueble | Anfitrión | Permite subir fotos de la propiedad a la CDN Cloudinary, ordenar su secuencia de visualización y eliminar capturas obsoletas. | Requiere al menos una imagen antes de poder publicar un anuncio derivado. |
| **RF-23** | Geolocalización Cartográfica de la Dirección | Anfitrión | Permite posicionar las coordenadas de latitud y longitud exactas del inmueble mediante el selector interactivo sobre OpenStreetMap. | Precisión decimal suficiente para representación en mapas sin revelar el piso exacto por privacidad. |
| **RF-24** | Borrado Lógico de Inmueble Base | Anfitrión | Permite al propietario retirar un inmueble de su inventario (`deletedAt`), preservando la integridad de reservas históricas. | Bloqueado si existen contratos o reservas activas en curso. |
| **RF-25** | Publicación de Nuevo Anuncio (Listing) | Anfitrión | Permite crear y poner en oferta pública un anuncio derivado de un inmueble base, fijando precio mensual, fianza, descripción y tipo de alquiler (piso completo o habitación). | Asociación de una selección ordenada de fotos tomadas de la galería del inmueble. |
| **RF-26** | Modificación de Condiciones de Anuncio | Anfitrión | Permite actualizar el título, texto descriptivo, precio mensual de renta y fianza de un anuncio ya publicado. | No altera retroactivamente las reservas ya aceptadas o confirmadas previamente. |
| **RF-27** | Selección y Reordenación de Fotos del Anuncio | Anfitrión | Permite seleccionar qué imágenes específicas del inmueble se muestran en el anuncio y fijar la fotografía de portada. | Validación de que las fotos pertenecen al inmueble físico subyacente. |
| **RF-28** | Modificación del Estado de Disponibilidad | Anfitrión | Permite alternar la visibilidad de la oferta entre `DISPONIBLE` y `NO_DISPONIBLE` (pausado temporal). | Los anuncios no disponibles quedan excluidos de las búsquedas públicas de forma inmediata. |
| **RF-29** | Consulta Pública de Detalle de Anuncio | Usuario Invitado / Autenticado | Permite consultar la ficha completa del anuncio: galería, precio, desglose de fianza, anfitrión, mapa aproximado y habitaciones hermanas del mismo piso. | En modalidad habitación (`ROOM`), enlaza automáticamente las demás habitaciones disponibles en el piso. |
| **RF-30** | Búsqueda Parametrizada con Filtros Combinados | Usuario Invitado / Autenticado | Permite buscar anuncios aplicando filtros simultáneos de ciudad, rango de precio mínimo/máximo, modalidad de alquiler y comodidades (*amenities*). | Ejecución mediante especificaciones dinámicas JPA (`Specification`) sobre anuncios disponibles. |
| **RF-31** | Exploración Cartográfica Interactiva con Agrupamiento | Usuario Invitado / Autenticado | Permite explorar anuncios sobre el mapa Leaflet, agrupando marcadores cercanos mediante *Supercluster* y filtrando por el área visible (*viewport bounds*). | Carga eficiente basada en cuadrantes de coordenadas y despliegue en abanico (*fan*) en coordenadas idénticas. |
| **RF-32** | Registro de Historial de Búsquedas Recientes | Usuario Autenticado | El sistema registra de manera transparente las búsquedas de los usuarios para comprender sus preferencias geográficas y presupuestarias. | Persistencia en `user_search_history` vinculada al ID del usuario autenticado. |
| **RF-33** | Motor de Recomendaciones Personalizadas | Usuario Autenticado | El sistema sugiere anuncios promocionados y destacados adaptados a la última búsqueda registrada del usuario (ciudad, tipo y presupuesto). | Consulta algorítmica ponderada en `RecommendationService`. |
| **RF-34** | Retirada y Borrado Lógico de Anuncio | Anfitrión | Permite al anfitrión retirar definitivamente su anuncio del mercado sin borrarlo físicamente de la base de datos. | Marca `deletedAt` y transición automática a estado `UNAVAILABLE`. |
| **RF-35** | Bloqueo Administrativo de Anuncio (Baneado) | Administrador del Sistema | Permite a la administración bloquear un anuncio infractor o fraudulento, retirándolo de las búsquedas y conservando su estado previo. | Transición a `BANNED` y almacenamiento de `previousStatus` para posible rehabilitación. |
| **RF-36** | Desbloqueo de Anuncio Baneado | Administrador del Sistema | Permite a la administración revocar el bloqueo de un anuncio, devolviéndolo a su estado de visibilidad anterior. | Restauración del estado registrado en `previousStatus`. |
| **RF-37** | Listado Global de Anuncios y Propiedades (Admin) | Administrador del Sistema | Permite a la administración auditar y filtrar el catálogo completo de inmuebles y anuncios de la plataforma, incluyendo borrados y baneados. | Vista administrativa con paginación avanzada y métricas de publicación. |

---

## 3. Subsistema de Confianza, Calificaciones y Reseñas Verificadas

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-38** | Consulta Pública de Reseñas y Puntuación Media | Usuario Invitado / Autenticado | Permite visualizar el histórico de opiniones públicas y la calificación media global (de 1 a 5 estrellas) asociada a un anuncio. | Cálculo de media aritmética y desglose de comentarios ordenados cronológicamente. |
| **RF-39** | Verificación de Elegibilidad para Reseñar | Inquilino | El sistema valida automáticamente si el usuario solicitante tiene derecho a emitir una valoración sobre un anuncio específico. | Regla estricta: el usuario debe poseer una reserva previa en estado `CONFIRMED` finalizada y sin reseña previa emitida. |
| **RF-40** | Publicación de Reseña y Valoración | Inquilino | Permite a un inquilino elegible calificar su experiencia de estancia aportando una puntuación numérica (1-5) y un comentario justificativo. | Creación del registro en `accommodation_reviews` asociado biunívocamente a la solicitud de reserva validada. |

---

## 4. Subsistema de Reservas y Gestión de Fianzas

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-41** | Envío de Solicitud de Reserva | Inquilino | Permite a un interesado remitir una solicitud formal de alquiler a un anuncio, seleccionando fecha de inicio, duración en meses y mensaje de contacto. | Regla de backend: la reserva debe iniciar el día 1 de mes y concluir el último día del mes resultante. |
| **RF-42** | Consulta de Solicitudes Enviadas (Inquilino) | Inquilino | Permite al inquilino supervisar el estado cronológico de todas las solicitudes de reserva que ha cursado en la plataforma. | Paginación por estado: `PENDIENTE`, `ACEPTADA`, `RECHAZADA`, `CONFIRMADA`, `CANCELADA`, `EXPIRADA`. |
| **RF-43** | Cancelación de Solicitud Pendiente | Inquilino | Permite al inquilino retirar una petición de reserva mientras el anfitrión aún no la haya aceptado. | Transición a estado `CANCELLED` y liberación del bloqueo temporal. |
| **RF-44** | Consulta de Solicitudes Recibidas (Anfitrión) | Anfitrión | Permite al propietario listar y filtrar las peticiones de reserva que han llegado sobre sus anuncios publicados. | Acceso condicionado a la titularidad del anuncio (`hostId == currentUserId`). |
| **RF-45** | Aceptación de Solicitud de Reserva | Anfitrión | Permite al anfitrión aceptar una petición de estancia, habilitando al inquilino el plazo para formalizar la fianza. | Transición a `ACCEPTED` y cálculo de fecha límite de expiración para el pago. |
| **RF-46** | Rechazo de Solicitud de Reserva | Anfitrión | Permite al anfitrión desestimar una solicitud de reserva entrante que no encaje con los criterios del piso. | Transición a `REJECTED` con notificación al inquilino solicitante. |
| **RF-47** | Confirmación y Registro de Pago de Fianza | Inquilino | Permite registrar el abono formal de la fianza asociada a una reserva aceptada, aportando el identificador de la transacción y pasarela. | Transición final a `CONFIRMED`, consolidando el contrato de reserva. |
| **RF-48** | Expiración Automática de Reservas Desatendidas | Sistema | El sistema expira y cancela automáticamente las reservas pendientes que superen el tiempo máximo de respuesta o pago fijado. | Tarea periódica del sistema que transita estados caducados a `EXPIRED`. |
| **RF-49** | Auditoría y Supervisión Global de Reservas (Admin) | Administrador del Sistema | Permite a la administración examinar todas las transacciones de reserva del sistema, mediando en posibles disputas. | Acceso sin restricciones a los expedientes de contratación en `/api/v1/admin/bookings`. |

---

## 5. Subsistema de Comunidad de Convivencia y Hogar (Homes)

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-50** | Creación de Hogar (Coliving) | Usuario Autenticado | Permite dar de alta un espacio de convivencia, otorgando al creador el rol de Administrador del Hogar y generando un código de invitación único. | Registro en tabla `homes` y vinculación del primer miembro en `home_members` con rol `ADMIN`. |
| **RF-51** | Unión al Hogar mediante Código de Invitación | Usuario Autenticado | Permite a un compañero unirse a un hogar introduciendo el código alfanumérico generado por el administrador. | Validación de código vigente; alta en `home_members` con rol inicial `MEMBER` y estado `ACTIVE`. |
| **RF-52** | Consulta de Panel y Detalle de Convivencia | Compañero de Piso | Permite a los convivientes visualizar las reglas, información general, listado de miembros activos y pestañas de gestión. | Solo accesible para usuarios cuyo estado de membresía sea `ACTIVE`. |
| **RF-53** | Regeneración de Código de Invitación | Administrador del Hogar | Permite al administrador del piso invalidar el código actual y emitir uno nuevo para impedir accesos no deseados. | Actualización del código único aleatorio en la entidad `Home`. |
| **RF-54** | Personalización de Color de Identificación | Compañero de Piso | Permite a cada miembro seleccionar un color representativo para identificar sus intervenciones en gráficos de gastos y cuadrantes de tareas. | Persistencia del valor cromático en `HomeMember.color`. |
| **RF-55** | Registro Cronológico de Actividad (Feed de Auditoría) | Compañero de Piso | El sistema genera y exhibe un muro cronológico inmutable de todos los eventos relevantes acontecidos en el piso. | Creación automática de `ActivityLog` en eventos de miembros, gastos, pagos y tareas. |
| **RF-56** | Salida Voluntaria del Hogar | Compañero de Piso | Permite a un conviviente abandonar el piso por voluntad propia, perdiendo acceso a la operativa activa y pasando a histórico. | Regla obligatoria: el saldo neto consolidado del miembro debe ser exactamente cero (`Balance == 0.00`). |
| **RF-57** | Expulsión Ordinaria de Miembro | Administrador del Hogar | Permite al administrador expulsar a un compañero del piso por razones de convivencia, respetando el control de deudas. | Requiere comprobación previa de saldo cero; si tiene deudas pendientes, el sistema bloquea la expulsión ordinaria. |
| **RF-58** | Expulsión Forzosa con Absorción de Deuda | Administrador del Hogar | Permite al administrador expulsar de forma extraordinaria a un miembro moroso o conflictivo, sobreescribiendo el bloqueo de saldo. | El sistema genera automáticamente un gasto interno de condonación que reparte la deuda impagada entre los restantes miembros. |
| **RF-59** | Transferencia de Privilegios de Administrador | Administrador del Hogar | Permite ceder la administración del piso a cualquier otro compañero activo del hogar. | Degrada al administrador cedente a `MEMBER` y eleva al usuario seleccionado a `ADMIN`. |
| **RF-60** | Promoción Automática de Administrador por Abandono | Sistema | Si el administrador único elimina su cuenta de usuario, el sistema transfiere automáticamente el liderazgo al miembro activo más antiguo. | Listener `HomeMemberOrphanListener` en backend para evitar hogares huérfanos. |
| **RF-61** | Archivado y Desarchivado de Vista de Hogar | Administrador del Hogar / Miembro | Permite ocultar temporalmente un hogar en el panel personal para no saturar la vista principal cuando la convivencia concluye. | Actualización del estado del miembro a `ARCHIVED` sin perder el registro histórico. |
| **RF-62** | Historial de Hogares Pasados | Compañero de Piso | Permite acceder a una vista de sólo lectura de los pisos en los que el usuario participó en el pasado. | Acceso histórico a auditorías y balances de convivencia concluidos. |
| **RF-63** | Cierre Automático de Hogar Desierto | Sistema | Cuando el último miembro activo abandona o es expulsado de un hogar, el sistema clausura y marca como borrado lógico el piso. | Marcado de `deletedAt` en `Home` para evitar entidades vacías operativas. |

---

## 6. Subsistema de Gestión Financiera y Gastos Compartidos

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-64** | Registro de Gasto Compartido | Compañero de Piso | Permite registrar un desembolso económico (suministros, compra común, reparaciones), indicando pagador, concepto, importe y participantes. | Soporta reparto equitativo automático o desglose porcentual/nominal personalizado sumando el 100%. |
| **RF-65** | Modificación de Gasto Registrado | Compañero de Piso | Permite al autor del gasto o al administrador del hogar editar los importes, concepto o participantes de un gasto erróneo. | Recálculo atómico e inmediato de los balances netos consolidados del hogar. |
| **RF-66** | Eliminación de Gasto | Compañero de Piso | Permite anular un apunte de gasto registrado por equivocación, extrayéndolo de las cuentas del piso. | Borrado del registro en `expenses` y sus correspondientes `expense_splits`. |
| **RF-67** | Filtrado Avanzado de Gastos | Compañero de Piso | Permite acotar el historial de cuentas por rangos temporales (mes actual, fechas personalizadas) y por convivientes participantes. | Filtrado eficiente mediante criterios combinados en `ExpenseService`. |
| **RF-68** | Cálculo de Balances Individuales en Tiempo Real | Sistema | El sistema consolida en tiempo real las cantidades aportadas versus las cantidades adeudadas por cada miembro, mostrando su saldo neto. | Modelo de balance: `Saldo > 0` (acreedor), `Saldo < 0` (deudor), `Saldo = 0` (equilibrado). |
| **RF-69** | Algoritmo de Compensación Óptima de Deudas | Sistema | El sistema calcula el grafo simplificado de transferencias mínimas (*Debt Transfers*) para saldar las cuentas del piso con el menor número de operaciones posibles. | Implementación del algoritmo voraz en `DebtTransfer.java` para reducir transferencias cruzadas. |
| **RF-70** | Registro de Liquidación y Pago Directo entre Compañeros | Compañero de Piso | Permite registrar una transferencia directa efectuada entre dos compañeros para saldar o minorar una deuda existente. | Creación de registro en `expense_payments` que compensa los saldos respectivos en el balance. |

---

## 7. Subsistema de Tareas Domésticas y Cuadrantes (Chores)

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-71** | Creación de Serie de Tareas Recurrente | Administrador del Hogar | Permite programar tareas del hogar estableciendo título, descripción, puntuación base, frecuencia (diaria, semanal, mensual, días específicos) y participantes asignados. | Persistencia en `chore_series` con definición de repeticiones y fechas límites calculadas. |
| **RF-72** | Configuración de Estrategia de Asignación | Administrador del Hogar | Permite elegir entre asignación fija a un único miembro o rotación equitativa secuencial (*Round Robin*) entre los participantes seleccionados. | Control de rotación mediante puntero persistente `lastAssigneeIndex` en `ChoreSeries`. |
| **RF-73** | Creación de Tarea Puntual Aislada | Compañero de Piso | Permite dar de alta una tarea doméstica urgente o no periódica con una fecha límite específica y un asignatario único. | Creación directa de instancia en `chores` sin serie recurrente padre asociada. |
| **RF-74** | Tablero de Tareas y Cuadrante Calendario | Compañero de Piso | Permite visualizar las tareas del piso clasificadas por estados (`PENDIENTE`, `COMPLETADA`, `VENCIDA`), asignatario y fechas de vencimiento. | Vista interactiva de tareas pendientes con filtrado dinámico por conviviente. |
| **RF-75** | Marcado de Tarea Completada | Compañero de Piso | Permite al miembro asignado marcar su tarea como ejecutada, registrando la fecha y sumando los puntos base a su contador de contribución. | Transición de estado a `COMPLETED` y registro del timestamp de ejecución. |
| **RF-76** | Rescate de Tarea Vencida (Bonus de Puntos) | Compañero de Piso | Si una tarea vence sin completarse (`isLate == true`), cualquier otro compañero puede asumirla y completarla para obtener los puntos de rescate. | Transición a `LATE_COMPLETED`, acreditando la autoría al usuario rescatador (`completedBy`). |
| **RF-77** | Eliminación de Tarea o Cancelación de Serie | Administrador del Hogar | Permite cancelar una tarea pendiente puntual o rescindir todas las ocurrencias futuras de una serie de tareas recurrentes. | Eliminación física de tareas pendientes sin alterar las tareas ya completadas en el historial. |
| **RF-78** | Rebalanceo Automático de Tareas por Salida de Miembro | Sistema | Cuando un conviviente causa baja en el hogar, el sistema reasigna de manera automática sus tareas pendientes al resto de compañeros activos. | Redistribución equitativa para evitar parálisis en la limpieza o mantenimiento del piso. |

---

## 8. Subsistema de Mensajería Contextual Directa

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-79** | Inicio de Conversación Vinculada a un Anuncio | Inquilino | Permite a un interesado abrir un hilo de chat directo con el anfitrión desde la ficha de un anuncio, vinculando el contexto inmobiliario. | Creación de entidad `Conversation` vinculada al anuncio; prevención de hilos duplicados entre el mismo par de usuarios. |
| **RF-80** | Bandeja de Entrada con Contador de No Leídos | Usuario Autenticado | Permite consultar la relación de chats activos del usuario, visualizando el último mensaje, fecha de actividad y burbuja de mensajes pendientes de lectura. | Contadores atómicos diferenciados: `tenantUnreadCount` y `hostUnreadCount`. |
| **RF-81** | Intercambio de Mensajes de Texto | Usuario Autenticado | Permite remitir y recibir mensajes de texto entre inquilino y anfitrión dentro de un hilo de conversación activo. | Persistencia en tabla `messages` con asociación a remitente y actualización de vista previa de conversación. |
| **RF-82** | Marcado de Mensajes como Leídos | Usuario Autenticado | Al acceder al chat, el sistema actualiza automáticamente los mensajes pendientes a leídos y reinicia el contador del participante. | Transición de `SENT`/`DELIVERED` a `READ` con registro de `readAt`. |
| **RF-83** | Archivado Independiente de Conversaciones | Usuario Autenticado | Permite a cada participante ocultar un chat de su bandeja principal sin afectar la visibilidad del otro interlocutor. | Marcadores booleanos separados: `archivedByHost` y `archivedByTenant`. |
| **RF-84** | Recordatorio Automático de Conversación Inactiva | Sistema | El sistema puede marcar y remitir un aviso automático de cortesía si una consulta sobre un anuncio queda desatendida por el anfitrión. | Activación del indicador `nudgeSent` tras superar el umbral de cortesía. |
| **RF-85** | Inspección de Conversación por Denuncia (Admin) | Administrador del Sistema | Permite a los moderadores consultar íntegramente el historial de mensajes de un chat que ha sido objeto de una denuncia por acoso o fraude. | Acceso restringido con justificación en expediente de moderación (`/chat-inspection`). |

---

## 9. Subsistema de Moderación, Denuncias y Gobernanza Global

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-86** | Emisión de Denuncia (Reporte de Infracción) | Usuario Autenticado | Permite remitir una queja formal contra un anuncio sospechoso, un usuario ofensivo o una conversación, indicando motivo y descripción. | Creación en tabla `reports` con tipología polimórfica (`LISTING`, `USER`, `CONVERSATION`). |
| **RF-87** | Consulta y Filtrado de Cola Global de Moderación | Administrador del Sistema | Permite a la administración cribar denuncias por objetivo, motivo (`SPAM`, `FRAUDE`, `ACOSO`, `CONTENIDO_INAPROPIADO`), estado y antigüedad. | Vista paginada de supervisión en el panel administrativo (`/api/v1/admin/reports`). |
| **RF-88** | Gestión del Expediente y Dictamen de Denuncia | Administrador del Sistema | Permite a un moderador poner una denuncia en investigación, resolverla aplicando sanciones o desestimarla, adjuntando notas internas. | Transición de ciclo de vida: `PENDIENTE` $\rightarrow$ `EN_INVESTIGACION` $\rightarrow$ `RESUELTA` / `DESESTIMADA`. |
| **RF-89** | Bucle de Feedback de Resolución al Denunciante | Usuario Autenticado | El usuario que interpuso la denuncia puede consultar el veredicto y las explicaciones emitidas por la administración. | Marcado `reporterNotified = true` y consulta en `ReportFeedbackModal`. |
| **RF-90** | Resolución y Acciones Masivas en Lote (Bulk Action) | Administrador del Sistema | Permite dictaminar de forma unificada y atómica múltiples denuncias que apuntan hacia un mismo infractor o anuncio. | Operación batch transaccional que actualiza masivamente los expedientes agrupados. |
| **RF-91** | Ranking de Infractores Más Denunciados (Top Ranking) | Administrador del Sistema | Genera un informe estadístico priorizado con las cuentas y publicaciones que acumulan mayor volumen de denuncias en el sistema. | Agrupación analítica en base de datos para detección proactiva de fraudes recurrentes. |

---

## 10. Subsistema de Asistente Inteligente (IA) y Herramientas Conectadas (MCP)

| ID | Nombre | Actor Principal | Descripción | Reglas de Negocio / Trazabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-92** | Diálogo Conversacional en Lenguaje Natural con Copiloto IA | Usuario Autenticado | Permite al usuario interactuar mediante un chat inteligente guiado por Spring AI para formular dudas de la plataforma o pedir asistencia. | Integración con LLM en streaming con gestión de contexto conversacional y prompts de sistema. |
| **RF-93** | Emisión de Tickets de Autorización Efímeros MCP | Usuario Autenticado | El backend genera tickets temporales y seguros para autorizar las invocaciones de herramientas del protocolo MCP en nombre del usuario. | Token criptográfico de vida ultracorta gestionado por `DefaultMcpTicketService`. |
| **RF-94** | Herramienta MCP: Búsqueda Semántica por Afinidad (Vibe Search) | Asistente IA / Sistema | Permite a la IA buscar y recomendar anuncios analizando descripciones en lenguaje natural basadas en preferencias de estilo de vida, luz, tranquilidad o ambiente. | Invocación de la herramienta `search_listings_by_vibe` con filtrado vectorial o semántico. |
| **RF-95** | Herramienta MCP: Consulta del Estado de Reservas | Asistente IA / Sistema | Permite al copiloto informar al usuario en tiempo real sobre la situación de sus reservas activas, pendientes de pago o aceptadas. | Invocación de `check_user_bookings` con el contexto del usuario autenticado. |
| **RF-96** | Herramienta MCP: Resumen Inteligente de Mensajes | Asistente IA / Sistema | Permite a la IA sintetizar las conversaciones entrantes del usuario, resumiendo preguntas de inquilinos o avisos urgentes. | Invocación de `summarize_inbox` sin exponer datos confidenciales a terceros. |
| **RF-97** | Herramienta MCP: Supervisión de Tareas y Cuadrante del Piso | Asistente IA / Sistema | Permite a la IA comprobar qué tareas domésticas tiene pendientes el usuario, cuáles están vencidas y cuántos puntos acumula en su piso. | Invocación de `get_home_chores_overview`. |
| **RF-98** | Herramienta MCP: Inspección de Cola de Moderación (Exclusivo Admin) | Asistente IA / Administrador | Permite a un administrador solicitar a la IA un balance resumido de denuncias urgentes pendientes de resolución en la plataforma. | Invocación de `inspect_moderation_queue` restringida por autorización de rol `ADMIN`. |

---

## 11. Matriz de Resumen Cuantitativo de Requisitos

| Subsistema Funcional | Rango de Identificadores | Total de Requisitos |
| :--- | :--- | :---: |
| 1. Identidad, Autenticación y Perfiles | **RF-01 al RF-19** | 19 |
| 2. Inmuebles, Anuncios y Cartografía | **RF-20 al RF-37** | 18 |
| 3. Confianza, Calificaciones y Reseñas | **RF-38 al RF-40** | 3 |
| 4. Reservas y Fianzas | **RF-41 al RF-49** | 9 |
| 5. Comunidad de Convivencia y Hogar | **RF-50 al RF-63** | 14 |
| 6. Finanzas y Gastos Compartidos | **RF-64 al RF-70** | 7 |
| 7. Tareas Domésticas y Cuadrantes | **RF-71 al RF-78** | 8 |
| 8. Mensajería Contextual Directa | **RF-79 al RF-85** | 7 |
| 9. Moderación y Gobernanza Global | **RF-86 al RF-91** | 6 |
| 10. Asistente IA y Herramientas MCP | **RF-92 al RF-98** | 7 |
| **TOTAL REQUISITOS FUNCIONALES AUDITADOS** | **RF-01 al RF-98** | **98** |
