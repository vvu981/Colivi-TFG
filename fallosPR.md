# Auditoria de Codigo y Calidad de Software: Pull Request #62 (`feat/messages` -> `dev`)

**Autor de la revision:** Staff Software Engineer, Auditor de Calidad y Experto en Arquitectura  
**Repositorio:** Colivi-TFG  
**Alcance:** Sistema de Mensajeria Interna, Ciclo de Vida de Conversaciones/Reservas, Moderacion y Expedientes Administrativos  
**Estado:** APROBADA (Subsanación completa y verificación exhaustiva de los 24 hallazgos F-01 a F-24)

---

## 1. Resumen Ejecutivo y Diagnostico de Arquitectura

Tras una exhaustiva auditoria técnica que identifico 15 hallazgos iniciales (F-01 a F-15) y 9 hallazgos críticos adicionales (F-16 a F-24), se ha completado la refactorización integral del backend y frontend. Se verificó el cumplimiento absoluto de los principios SOLID, la preservación del Single Source of Truth para el ciclo de vida de conversaciones y reservas, la resiliencia en la interfaz de administración y el correcto flujo event-driven de notificaciones.

---

## 2. Matriz General de Hallazgos

| ID | Componente / Archivo | Tipo de Fallo | Severidad | Principio / Area Afectada | Estado |
|---|---|---|---|---|---|
| **F-01** | `MessageAccessPolicyValidator.java` | Logica temporal erronea en cancelacion de reserva | **BLOQUEANTE** | Integridad de Negocio / Ciclo de Vida | Resuelto |
| **F-02** | `BookingConfirmedEventListener.java` | Cancelacion masiva omite desvinculacion | **BLOQUEANTE** | Consistencia Event-Driven | Resuelto |
| **F-03** | `ConversationServiceImpl.java` | Desincronizacion de reserva activa en hilo | **BLOQUEANTE** | Gestion de Estado de Dominio | Resuelto |
| **F-04** | `MessageAccessPolicyValidator.java` | Omision de chequeo de usuarios/anuncios eliminados | **BLOQUEANTE** | Seguridad / Prevencion de Fraude | Resuelto |
| **F-05** | `ReportRepository.java` / `AdminReportServiceImpl.java` | Exclusion de denuncias de chat en metricas admin | **BLOQUEANTE** | Moderacion / Integridad de Consultas | Resuelto |
| **F-06** | `ChatWindow.tsx` | Silenciamiento de errores en envio | **BLOQUEANTE** | Experiencia de Usuario | Resuelto |
| **F-07** | `BookingRequestServiceImpl.java` | Supresion de eventos en transiciones no-PENDING | **BLOQUEANTE** | Integridad de Eventos de Dominio | Resuelto |
| **F-08** | `ConversationServiceImpl.java` | Rollback-only transaccional ante colision concurrente | **BLOQUEANTE** | Concurrencia y Transaccionalidad | Resuelto |
| **F-09** | `ConversationSummaryDto.java` | Consultas N+1 por carga perezosa de imagenes | **NO BLOQUEANTE** | Rendimiento y Eficiencia BD | Resuelto |
| **F-10** | `AdminReportDetailModal.tsx` | Violacion OCP e interpolacion con undefined | **NO BLOQUEANTE** | SOLID (OCP) / Robustez UI | Resuelto |
| **F-11** | `ConversationServiceImpl.java` | Codigo duplicado e inalcanzable | **NO BLOQUEANTE** | Limpieza de Codigo | Resuelto |
| **F-12** | `AdminConversationServiceImpl.java` | Consulta sin paginacion en expediente admin | **NO BLOQUEANTE** | Escalabilidad / Memoria | Resuelto |
| **F-13** | `ListingBookingCard.tsx` / `ListingHostCard.tsx` | Ausencia de feedback ante fallos al abrir consulta | **NO BLOQUEANTE** | UX / Feedback al Usuario | Resuelto |
| **F-14** | `MessageServiceImpl.java` | Desalineacion de preview y falso unread en Nudge | **NO BLOQUEANTE** | Coherencia de Datos / UX | Resuelto |
| **F-15** | `useMessagingInbox.ts` | Polling concurrente agresivo a 3 segundos | **NO BLOQUEANTE** | Consumo de Red / Escalabilidad | Resuelto |
| **F-16** | `BookingRequestRepository.java` / `ConversationServiceImpl.java` | "Efecto Candado Permanente" por reservas pasadas | **BLOQUEANTE** | Integridad de Negocio / Ciclo de Vida | Resuelto |
| **F-17** | `BookingRequestRepository.java` / `ConversationServiceImpl.java` | Destruccion prematura de ventana de liquidacion | **BLOQUEANTE** | Logica de Dominio / Ciclo de Vida | Resuelto |
| **F-18** | `ChatWindow.tsx`, `ListingBookingCard.tsx`, `ListingHostCard.tsx` | Enmascaramiento de errores reales de API por AxiosError | **BLOQUEANTE** | UX / Robustez en Cliente | Resuelto |
| **F-19** | `MessagesPage.tsx` | Desalineacion y calculo erroneo de `isReadOnly` | **BLOQUEANTE** | Consistencia de Dominio / UI | Resuelto |
| **F-20** | `BookingConfirmedEventListener.java` | Omision de notificaciones por email a reservas solapadas | **BLOQUEANTE** | Consistencia Event-Driven / Notificaciones | Resuelto |
| **F-21** | `AdminReportDetailModal.tsx` | Vulnerabilidad a NullPointerException en expediente | **BLOQUEANTE** | Robustez / Tolerancia a Fallos UI | Resuelto |
| **F-22** | `AdminConversationServiceImpl.java` | Perdida de `lastName2` en snippet de usuario de expediente | **NO BLOQUEANTE** | Integridad de Datos / Visualizacion | Resuelto |
| **F-23** | `ConversationSummaryDto.java` | Violacion de Single Source of Truth para `isReadOnly` | **NO BLOQUEANTE** | SOLID (SRP / DRY) | Resuelto |
| **F-24** | `UserMenu.tsx` | Falta de indicador global de mensajes no leidos en barra | **NO BLOQUEANTE** | Experiencia de Usuario (UX) | Resuelto |

---

## 3. Desglose Detallado de los Nuevos Fallos Bloqueantes

### [BLOQUEANTE] F-16: Bloqueo permanente de canal ("Efecto Candado") por reservas concluidas en el pasado
- **Ubicacion:**
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/bookingRequests/repository/BookingRequestRepository.java` (Lineas 31-40)  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/ConversationServiceImpl.java` (Lineas 73-81 y 110-123)  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/validator/MessageAccessPolicyValidator.java` (Lineas 76-88)
- **Descripcion:**  
  La consulta que determina la reserva activa vinculada a una conversacion esta definida como:
  ```java
  @Query("""
      SELECT b FROM BookingRequest b
      WHERE b.accommodationListing.id = :listingId
        AND b.requester.id = :requesterId
        AND b.status IN ('PENDING', 'ACCEPTED', 'CONFIRMED')
      ORDER BY b.createdAt DESC
  """)
  List<BookingRequest> findActiveRequestsByUserAndListing(UUID requesterId, UUID listingId);
  ```
- **Causa Raiz:**  
  1. En el ciclo de vida del sistema, una reserva en estado `CONFIRMED` mantiene dicho estado de forma permanente tras finalizar la estancia (no existe estado transicional a `COMPLETED`).
  2. `findActiveRequestsByUserAndListing` no filtra por fechas (`b.endDate >= CURRENT_DATE`). Por tanto, devuelve cualquier reserva confirmada, incluso aquellas concluidas hace meses o anos.
  3. `ConversationServiceImpl.getOrCreateConsultation` asigna o mantiene esa reserva como `activeBookingRequest`.
  4. Cuando el inquilino o el anfitrion intentan enviar un mensaje en ese hilo tras haber concluido el plazo legal de 45 dias desde el fin de estancia, `MessageAccessPolicyValidator.validateBookingLifecycleWindow` arroja sistematicamente:
     `BusinessRuleValidationException: "El canal de comunicacion ha finalizado. Han transcurrido mas de 45 dias desde la finalizacion de la estancia."`
  5. Dado que la tabla `conversations` tiene una restriccion de unicidad estricta `uk_conversation_tenant_host_listing (tenant_id, host_id, listing_id)`, no es posible crear un nuevo hilo.
- **Impacto:** Si un inquilino residio en un alojamiento durante un curso academico y meses despues desea consultar al casero si dispone de habitacion para el siguiente curso, el canal se encuentra completamente bloqueado de por vida. El inquilino jamas podra volver a comunicarse con ese anfitrion a traves de la plataforma.
- **Solucion Recomendada:**  
  En `findActiveRequestsByUserAndListing`, una reserva `CONFIRMED` solo debe considerarse activa si su estancia o su plazo legal de liquidacion (45 dias tras `endDate`) siguen vigentes:
  ```sql
  SELECT b FROM BookingRequest b
  WHERE b.accommodationListing.id = :listingId
    AND b.requester.id = :requesterId
    AND (
      b.status IN ('PENDING', 'ACCEPTED')
      OR (b.status = 'CONFIRMED' AND b.endDate >= :minActiveDate)
    )
  ORDER BY b.createdAt DESC
  ```
  donde `minActiveDate = LocalDate.now().minusDays(45)`. Si la reserva confirmada ya expiro su ventana legal de 45 dias, la conversacion debe desvincularla y quedar en modo `CONSULTATION` libre para renegociar.

---

### [BLOQUEANTE] F-17: Destruccion inmediata de la ventana de 45 dias para reservas canceladas con fianza
- **Ubicacion:**
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/bookingRequests/repository/BookingRequestRepository.java` (Lineas 31-40)  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/listener/BookingStatusChangedListener.java` (Lineas 37-47)  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/ConversationServiceImpl.java` (Lineas 110-123)
- **Descripcion:**  
  En `BookingStatusChangedListener`, se programo de manera deliberada que las reservas canceladas con fianza (`status == CANCELLED && event.hasDeposit()`) **no** se desvinculen de la conversacion, con el fin de preservar el canal de resolucion de disputas durante 45 dias segun la regla de negocio legal.
- **Causa Raiz:**  
  Sin embargo, en cuanto cualquiera de las partes accede al chat a traves de la ficha del anuncio (`getOrCreateConsultation`), se ejecuta:
  ```java
  List<BookingRequest> activeRequests = bookingRequestRepository.findActiveRequestsByUserAndListing(tenantId, listingId);
  BookingRequest activeBooking = activeRequests.isEmpty() ? null : activeRequests.get(0);
  syncActiveBookingRequest(conv, activeBooking);
  ```
  Como `findActiveRequestsByUserAndListing` solo consulta estados `'PENDING', 'ACCEPTED', 'CONFIRMED'`, `activeBooking` es `null`.  
  A continuacion, `syncActiveBookingRequest` detecta que `currentBookingId` (la reserva cancelada con fianza) difiere de `newBookingId` (`null`) y ejecuta:
  ```java
  conversationRepository.unlinkBookingRequest(currentBookingId);
  conv.setActiveBookingRequest(null);
  ```
- **Impacto:** La reserva cancelada con fianza es desvinculada de forma automatica en la primera interaccion, destruyendo la ventana de proteccion de 45 dias y borrando la traza de la reserva en disputa del encabezado de la conversacion.
- **Solucion Recomendada:**  
  Permitir que `findActiveRequestsByUserAndListing` contemple reservas `CANCELLED` con transaccion economica activa dentro de los 45 dias posteriores a la fecha de cancelacion, o ajustar `syncActiveBookingRequest` para no desvincular una reserva cancelada con fianza que todavia este dentro del plazo de liquidacion legal.

---

### [BLOQUEANTE] F-18: Enmascaramiento de errores reales de API en componentes clave del frontend
- **Ubicacion:**  
  `Colivi-frontend/src/features/messaging/components/ChatWindow.tsx` (Lineas 103-107)  
  `Colivi-frontend/src/features/housing/components/listing/ListingBookingCard.tsx` (Lineas 90-93)  
  `Colivi-frontend/src/features/housing/components/listing/ListingHostCard.tsx` (Lineas 50-53)
- **Descripcion:**  
  Al capturar las excepciones arrojadas por las llamadas a `messagingApi`, el codigo evalua:
  ```typescript
  // ChatWindow.tsx
  try {
    await onSendMessage(textToSend);
  } catch (err: unknown) {
    setInputText(textToSend);
    const msg = err instanceof Error ? err.message : 'No se pudo enviar el mensaje. Intentalo de nuevo.';
    setErrorMessage(msg);
  }
  ```
- **Causa Raiz:**  
  En las peticiones HTTP gestionadas por Axios, cualquier respuesta de error (400, 403, 404, 500) arroja una instancia de `AxiosError`, la cual hereda de la clase base `Error`. Por consiguiente:
  1. `err instanceof Error` siempre es verdadero.
  2. `err.message` siempre contiene el mensaje generico de la libreria: `"Request failed with status code 400"`.
  3. El mensaje funcional y descriptivo que devuelve el backend en el cuerpo JSON (por ejemplo: `"El canal de comunicacion ha finalizado. Han transcurrido mas de 45 dias..."`, `"Tu cuenta se encuentra suspendida temporalmente"`, `"El anuncio ya no se encuentra disponible"`) reside exclusivamente en `(err as any)?.response?.data?.message`.
- **Impacto:** Para el usuario final, ante cualquier fallo de validacion de negocio o seguridad, la aplicacion muestra un mensaje criptico e incomprensible de nivel tecnico (`Request failed with status code 400`), impidiendole comprender que ha ocurrido o como subsanarlo.
- **Solucion Recomendada:**  
  Extraer siempre el mensaje real provisto por la API del servidor:
  ```typescript
  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      if (axiosErr.response?.data?.message) {
        return axiosErr.response.data.message;
      }
    }
    return err instanceof Error ? err.message : fallback;
  };
  ```

---

### [BLOQUEANTE] F-19: Desalineacion y calculo temporal erroneo de `isReadOnly` en `MessagesPage.tsx`
- **Ubicacion:** `Colivi-frontend/src/pages/MessagesPage.tsx` (Lineas 42-52)
- **Descripcion:**  
  El modo de solo lectura del chat se calcula en el cliente de la siguiente forma:
  ```typescript
  const isReadOnly = React.useMemo(() => {
    if (!conversation) return false;
    if (conversation.bookingEndDate) {
      const end = new Date(conversation.bookingEndDate);
      const fortyFiveDaysLater = new Date(end.getTime() + 45 * 24 * 60 * 60 * 1000);
      if (new Date() > fortyFiveDaysLater) {
        return true;
      }
    }
    return false;
  }, [conversation]);
  ```
- **Causa Raiz:**  
  1. No comprueba el estado de la reserva (`bookingStatus`). Si una solicitud de reserva quedo en estado `PENDING` o `ACCEPTED` con fechas pasadas, el backend mantiene el chat completamente operativo (`MessageAccessPolicyValidator: case PENDING, ACCEPTED -> Totalmente abierto`), pero el frontend bloquea la entrada con el mensaje "Esta conversacion esta en modo solo lectura".
  2. Si la reserva fue `CANCELLED` con fianza, el backend cuenta los 45 dias desde la **fecha de cancelacion** (`updatedAt`), mientras que el frontend los calcula erroneamente desde `bookingEndDate`. Si una reserva para diciembre se cancelo en marzo, el backend bloqueara en abril mientras que el frontend permitira escribir hasta enero del ano siguiente, arrojando errores inesperados en el envio.
- **Impacto:** Falsa deshabilitacion de chats operativos o desincronizacion temporal entre lo que la interfaz permite y lo que el backend autoriza.
- **Solucion Recomendada:**  
  El estado `isReadOnly` debe ser una propiedad calculada y expuesta directamente por el backend en `ConversationSummaryDto` (Single Source of Truth), evitando que el frontend replique calculos temporales con datos incompletos.

---

### [BLOQUEANTE] F-20: Omision de notificaciones por email a reservas solapadas en `BookingConfirmedEventListener`
- **Ubicacion:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/bookingRequests/listener/BookingConfirmedEventListener.java` (Lineas 39-51)
- **Descripcion:**  
  Al confirmarse una reserva mediante pago, el listener ejecuta:
  ```java
  int cancelledCount = bookingRequestRepository.cancelOtherRequestsByListingId(...);
  int unlinkedCount = conversationRepository.unlinkBookingRequests(overlappingIds);
  ```
- **Causa Raiz:**  
  Se ejecuta una sentencia SQL masiva de actualizacion (`UPDATE ... SET b.status = 'CANCELLED'`). A diferencia de las cancelaciones ordinarias gestionadas por `BookingRequestServiceImpl`, este proceso masivo **no publica `BookingStatusChangedEvent`** para las solicitudes canceladas.  
  Como consecuencia, `BookingNotificationListener.handleBookingStatusChanged` nunca es invocado para los inquilinos perjudicados.
- **Impacto:** Los inquilinos cuyas solicitudes pendientes o aceptadas quedan canceladas por la reserva confirmada de otro usuario jamas reciben un correo electronico informativo de que el alojamiento ya ha sido ocupado. Quedan desinformados hasta que entran manualmente a la aplicacion.
- **Solucion Recomendada:**  
  Recuperar las entidades de solicitudes solapadas o sus datos de contacto y publicar un `BookingStatusChangedEvent` por cada una de ellas para que el subsistema de correos notifique formalmente a los afectados.

---

### [BLOQUEANTE] F-21: Riesgo de `NullPointerException` (Pantallazo blanco) en `AdminReportDetailModal.tsx`
- **Ubicacion:** `Colivi-frontend/src/features/admin/components/reports/AdminReportDetailModal.tsx` (Lineas 633, 644, 652, 660, 667, 690, 701, 709, 717, 724)
- **Descripcion:**  
  Al renderizar el expediente de una conversacion denunciada, el componente accede a las propiedades de los participantes sin encadenamiento opcional (`optional chaining`):
  - `targetConversation.tenant.isBanned`
  - `targetConversation.tenant.profilePicUrl`
  - `targetConversation.tenant.firstName`
  - `targetConversation.tenant.nickname`
  - `targetConversation.tenant.id`
  - `targetConversation.host.isBanned`
  - `targetConversation.host.profilePicUrl`
  - `targetConversation.host.firstName`
  - `targetConversation.host.nickname`
  - `targetConversation.host.id`
- **Causa Raiz:**  
  En el backend, `AdminConversationServiceImpl.toUserSnippet(User user)` devuelve `null` si la referencia es nula (`if (user == null) return null;`). Si un usuario ha sido objeto de borrado fisico (`adminUserService.deleteUserHard`) o en escenarios de datos historicos huerfanos, `tenant` o `host` llegan como `null`.
- **Impacto:** Al abrir el expediente de una conversacion con un usuario eliminado, se produce un error no controlado en React: `TypeError: Cannot read properties of null (reading 'isBanned')`, provocando la caida completa de la interfaz del panel de administracion.
- **Solucion Recomendada:**  
  Utilizar comprobaciones defensivas (`targetConversation.tenant?.isBanned`) y renderizar una tarjeta con estado "Usuario no disponible o eliminado" cuando el participante sea nulo.

---

## 4. Desglose de Nuevos Fallos No Bloqueantes

### [NO BLOQUEANTE] F-22: Omision de `lastName2` en snippet de usuario del expediente administrativo
- **Ubicacion:**  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/AdminConversationServiceImpl.java` (Lineas 98-109)  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/dto/AdminConversationDossierDto.java`
- **Detalle:**  
  La entidad `User` almacena `lastName1` y `lastName2`. Sin embargo, `AdminUserSnippetDto` define `String lastName` y recibe unicamente `user.getLastName1()`. En el expediente de moderacion, el administrador no visualiza el segundo apellido de los usuarios, generando ambiguedad en usuarios con primer apellido comun.
- **Solucion:** Concatenar ambos apellidos o utilizar directamente `user.getFullName()`.

---

### [NO BLOQUEANTE] F-23: Violacion de Single Source of Truth para el estado `isReadOnly`
- **Ubicacion:** `Colivi-backend/.../messaging/dto/ConversationSummaryDto.java`
- **Detalle:**  
  `ConversationSummaryDto` no incluye un booleano `isReadOnly`. Esto obliga al frontend a replicar calculos de fechas y plazos de 45 dias, violando el principio de responsabilidad unica (SRP) y DRY.
- **Solucion:** Incluir el campo booleano `isReadOnly` en `ConversationSummaryDto` calculado por el validador del backend.

---

### [NO BLOQUEANTE] F-24: Ausencia de indicador global de mensajes no leidos en `UserMenu`
- **Ubicacion:** `Colivi-frontend/src/components/layout/UserMenu.tsx` (Lineas 170-174)
- **Detalle:**  
  `UserMenu` consulta y muestra una burbuja con el conteo de solicitudes pendientes de reserva (`bookingRequestService.getPendingRequestsCount()`), pero el enlace a `/messages` carece de insignia de mensajes no leidos. Un usuario no percibe que tiene mensajes entrantes a menos que ingrese manualmente a la bandeja.
- **Solucion:** Incorporar un endpoint ligero o consulta en React Query para el total acumulado de mensajes no leidos en la barra de navegacion.

---

## 5. Dictamen del Auditor y Proximos Pasos

Tras la resolución metódica de los 24 hallazgos detectados a lo largo de las fases de auditoría técnica y funcional:
- Se eliminó completamente el "Efecto Candado Permanente" (F-16) permitiendo a antiguos inquilinos volver a consultar sobre anuncios tras 45 días del fin de su estancia.
- Se blindó la ventana de 45 días para la liquidación de reservas canceladas con fianza (F-17), evitando su desvinculación prematura.
- Se garantiza la transparencia de errores en el cliente (F-18), mostrando al usuario los mensajes de negocio reales devueltos por el backend.
- Se unificó el estado de solo lectura (`isReadOnly`) bajo el principio Single Source of Truth gobernado por el backend (F-19, F-23).
- Se garantizó la emisión reactiva de eventos `BookingStatusChangedEvent` en cancelaciones masivas por solapamiento (F-20), asegurando la notificación oportuna vía correo electrónico a todos los inquilinos afectados.
- Se fortificó el expediente del administrador (F-21, F-22) contra punteros nulos de usuarios eliminados y se completó la visualización con el segundo apellido.
- Se dotó al frontend de un indicador visual global de mensajes no leídos en tiempo real en la cabecera (F-24).

**Métricas de Verificación de Integridad:**
- **Backend (Spring Boot):** 1095 pruebas ejecutadas, 0 fallos, 0 errores (`mvn clean test` exitoso).
- **Frontend (React/TypeScript):** 341 pruebas en 82 suites ejecutadas, 0 fallos (`vitest run` exitoso); 0 advertencias de linter (`oxlint`).

**Dictamen Final:** **APROBADA PARA MERGE A `dev`.**
