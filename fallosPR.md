# Auditoría de Código y Calidad de Software: Pull Request #62 (`feat/messages` -> `dev`)

**Autor de la revisión:** Staff Software Engineer & Auditor de Arquitectura  
**Repositorio:** Colivi-TFG  
**Alcance:** Sistema de Mensajería Interna, Ciclo de Vida de Conversaciones/Reservas, Moderación y Expedientes Administrativos  
**Estado:** RECHAZADA (Requiere subsanación de fallos bloqueantes antes de merge)

---

## 1. Resumen Ejecutivo

La Pull Request #62 introduce el subsistema completo de mensajería desacoplada entre inquilinos y anfitriones, con soporte para consultas previas, anclaje reactivo de solicitudes de reserva, nudges automáticos de conversión, canal de moderación con denuncias e inspección administrativa mediante expedientes.

A pesar de contar con una amplia suite de pruebas unitarias y de integración que superan la ejecución automática (`mvn test` y `vitest run` en verde), la auditoría técnica profunda ha revelado **8 fallos de gravedad BLOQUEANTE** y **7 fallos NO BLOQUEANTES** que comprometen la consistencia transaccional, la lógica de negocio temporal, la seguridad de moderación, la experiencia de usuario y el cumplimiento estricto de los principios SOLID (especialmente OCP y SRP).

---

## 2. Matriz de Hallazgos

| ID | Componente / Archivo | Tipo de Fallo | Severidad | Principio / Área Afectada |
|---|---|---|---|---|
| **F-01** | `MessageAccessPolicyValidator.java` | Lógica temporal errónea en cancelación de reserva | **BLOQUEANTE** | Integridad de Negocio / Ciclo de Vida |
| **F-02** | `BookingConfirmedEventListener.java` | Cancelación masiva omite eventos y desvinculación | **BLOQUEANTE** | Consistencia Event-Driven / Desacoplamiento |
| **F-03** | `ConversationServiceImpl.java` | Desincronización permanente de reserva activa | **BLOQUEANTE** | Lógica de Dominio / Gestión de Estado |
| **F-04** | `MessageAccessPolicyValidator.java` | Omisión de verificación de usuarios eliminados y anuncios baneados | **BLOQUEANTE** | Seguridad / Prevención de Fraude |
| **F-05** | `ReportRepository.java` / `AdminReportServiceImpl.java` | Exclusión total de denuncias de conversación en métricas admin | **BLOQUEANTE** | Moderación / Integridad de Consultas |
| **F-06** | `ChatWindow.tsx` | Silenciamiento de errores en envío de mensajes | **BLOQUEANTE** | Experiencia de Usuario / Tolerancia a Fallos |
| **F-07** | `BookingRequestServiceImpl.java` | Supresión de eventos en transiciones no originadas en PENDING | **BLOQUEANTE** | Integridad de Eventos de Dominio |
| **F-08** | `ConversationServiceImpl.java` | Fallo de recuperación transaccional por rollback-only ante colisión | **BLOQUEANTE** | Concurrencia / Transaccionalidad Spring |
| **F-09** | `ConversationSummaryDto.java` / `ConversationRepository.java` | Consultas N+1 por carga perezosa de imágenes de alojamiento | **NO BLOQUEANTE** | Rendimiento y Eficiencia BD |
| **F-10** | `AdminReportDetailModal.tsx` | Violación OCP e interpolación con valores undefined | **NO BLOQUEANTE** | SOLID (OCP) / Robustez UI |
| **F-11** | `ConversationServiceImpl.java` | Código duplicado e inalcanzable | **NO BLOQUEANTE** | Limpieza de Código / Mantenibilidad |
| **F-12** | `AdminConversationServiceImpl.java` | Consulta sin paginación ni límite de mensajes en expediente | **NO BLOQUEANTE** | Escalabilidad / Consumo de Memoria |
| **F-13** | `ListingBookingCard.tsx` / `ListingHostCard.tsx` | Ausencia de feedback ante fallos al abrir consulta | **NO BLOQUEANTE** | UX / Feedback al Usuario |
| **F-14** | `MessageServiceImpl.java` | Desalineación de preview y falso unread en Nudge del sistema | **NO BLOQUEANTE** | Coherencia de Datos / UX |
| **F-15** | `useMessagingInbox.ts` / `useConversationChat.ts` | Doble sondeo periódico concurrente a 3 segundos | **NO BLOQUEANTE** | Consumo de Red / Escalabilidad |

---

## 3. Desglose Detallado de Fallos Bloqueantes

### [BLOQUEANTE] F-01: Cálculo erróneo del plazo legal de 45 días en reservas canceladas
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/validator/MessageAccessPolicyValidator.java` (Líneas 76-86)
- **Descripción:**  
  En el método `validateBookingLifecycleWindow`, para el estado `CANCELLED`:
  ```java
  case CANCELLED -> {
      if (booking.getTransactionId() != null) {
          LocalDate legalCutoff = booking.getEndDate().plusDays(LEGAL_SETTLEMENT_DAYS);
          if (now.isAfter(legalCutoff)) {
              throw new BusinessRuleValidationException(...);
          }
      }
  }
  ```
- **Causa Raíz:**  
  El cálculo de la fecha límite toma como referencia `booking.getEndDate()`. Sin embargo, si una reserva con fianza se cancela meses antes de la fecha pactada de estancia (por ejemplo, reservada en marzo para noviembre, cancelada en abril), `booking.getEndDate()` se sitúa en noviembre. Por tanto, el canal de liquidación permanecerá abierto durante más de 7 meses (hasta diciembre), vulnerando el principio de que el canal de resolución de fianzas tras cancelación debe expirar estrictamente a los 45 días de haberse producido la cancelación (`booking.getUpdatedAt()`).  
  Por el contrario, si una reserva se cancela habiendo concluido ya la fecha teórica de fin de estancia, podría bloquear el canal inmediatamente el mismo día de la cancelación sin otorgar los 45 días garantizados.
- **Impacto:** Apertura indebida de canales cerrados durante meses/años o cierre prematuro sin posibilidad de resolución para el usuario.
- **Solución Recomendada:**  
  Calcular la fecha límite para reservas canceladas utilizando la fecha en la que se efectuó la cancelación (`booking.getUpdatedAt().toLocalDate()`) o un campo específico de auditoría de cancelación:
  ```java
  LocalDate cancellationDate = booking.getUpdatedAt() != null 
          ? booking.getUpdatedAt().toLocalDate() 
          : booking.getCreatedAt().toLocalDate();
  LocalDate legalCutoff = cancellationDate.plusDays(LEGAL_SETTLEMENT_DAYS);
  ```

---

### [BLOQUEANTE] F-02: Cancelación masiva de solicitudes solapadas elude la desvinculación reactiva
- **Ubicación:**  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/bookingRequests/listener/BookingConfirmedEventListener.java` (Líneas 27-33)  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/bookingRequests/repository/BookingRequestRepository.java` (Líneas 54-68)
- **Descripción:**  
  Al confirmarse una reserva mediante pago, `BookingConfirmedEventListener` ejecuta la sentencia nativa `cancelOtherRequestsByListingId(...)` para cancelar las solicitudes solapadas en estado `PENDING` o `ACCEPTED`.
- **Causa Raíz:**  
  Esta sentencia `@Modifying` modifica el estado directamente en base de datos mediante SQL masivo sin pasar por el ciclo de entidades JPA ni publicar eventos de dominio `BookingStatusChangedEvent`.  
  Al no emitirse dicho evento:
  1. `BookingStatusChangedListener` nunca es notificado.
  2. `conversationService.unlinkBookingRequest(...)` nunca se ejecuta para las solicitudes canceladas.
  3. Las conversaciones asociadas retienen de forma indefinida en la columna `active_booking_request_id` un puntero a una reserva ya cancelada.
- **Impacto:** Las conversaciones quedan ancladas permanentemente a reservas canceladas. Como consecuencia directa (ver F-03), el usuario nunca podrá vincular una nueva solicitud activa a ese hilo.
- **Solución Recomendada:**  
  En `cancelOtherRequestsByListingId`, recuperar los identificadores de las solicitudes afectadas antes de la cancelación o ejecutar un `UPDATE` en conversaciones dentro del mismo listener:
  ```java
  List<BookingRequest> conflictingRequests = bookingRequestRepository.findConflictingRequests(...);
  for (BookingRequest req : conflictingRequests) {
      req.cancel();
      bookingRequestRepository.save(req);
      eventPublisher.publishEvent(new BookingStatusChangedEvent(
          req.getId(), req.getRequester().getEmail(), req.getAccommodationListing().getTitle(),
          RequestStatus.CANCELLED, false, null, false
      ));
  }
  ```
  O alternativamente, invocar directamente la desvinculación en masa en `ConversationRepository`:
  ```sql
  UPDATE Conversation c SET c.activeBookingRequest = null 
  WHERE c.activeBookingRequest.id IN :cancelledIds
  ```

---

### [BLOQUEANTE] F-03: Desincronización permanente de reserva activa en `getOrCreateConsultation`
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/ConversationServiceImpl.java` (Líneas 73-80)
- **Descripción:**  
  En el flujo de recuperación o creación de una conversación:
  ```java
  List<BookingRequest> activeRequests = bookingRequestRepository.findActiveRequestsByUserAndListing(tenantId, listingId);
  BookingRequest activeBooking = activeRequests.isEmpty() ? null : activeRequests.get(0);

  Optional<Conversation> existing = conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, host.getId(), listingId);
  if (existing.isPresent()) {
      Conversation conv = existing.get();
      if (conv.getActiveBookingRequest() == null && activeBooking != null) {
          conversationRepository.linkActiveBookingRequest(conv.getId(), activeBooking);
          conv.setActiveBookingRequest(activeBooking);
      }
      return conv;
  }
  ```
- **Causa Raíz:**  
  La condición `conv.getActiveBookingRequest() == null` asume que una conversación previa solo puede estar vacía o con la reserva correcta. Si la conversación contenía una reserva que fue cancelada (con fianza o por el fallo F-02), rechazada o expirada sin haberse desvinculado, `conv.getActiveBookingRequest()` NO es nulo.  
  Si el inquilino envía posteriormente una nueva solicitud para otras fechas (`activeBooking` no nulo con estado `PENDING`), la condición falla y la nueva solicitud **NUNCA** se enlaza. La conversación queda desincronizada permanentemente.
- **Impacto:** Los usuarios y el anfitrión ven en la cabecera del chat el estado de una solicitud caducada o cancelada en lugar de la nueva solicitud pendiente que están negociando.
- **Solución Recomendada:**  
  Sincronizar el puntero dinámicamente si la reserva enlazada ya no está activa o si existe una nueva solicitud prioritaria:
  ```java
  BookingRequest currentLinked = conv.getActiveBookingRequest();
  boolean isCurrentLinkedActive = currentLinked != null && 
      (currentLinked.getStatus() == RequestStatus.PENDING || 
       currentLinked.getStatus() == RequestStatus.ACCEPTED || 
       currentLinked.getStatus() == RequestStatus.CONFIRMED);

  if (!isCurrentLinkedActive && activeBooking != null) {
      conversationRepository.linkActiveBookingRequest(conv.getId(), activeBooking);
      conv.setActiveBookingRequest(activeBooking);
  } else if (!isCurrentLinkedActive && currentLinked != null) {
      conversationRepository.unlinkBookingRequest(currentLinked.getId());
      conv.setActiveBookingRequest(null);
  }
  ```

---

### [BLOQUEANTE] F-04: Omisión de verificación de usuarios eliminados y anuncios baneados en envío de mensajes
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/validator/MessageAccessPolicyValidator.java` (Líneas 29-38)
- **Descripción:**  
  La política de validación en `validateCanSendMessage` comprueba:
  ```java
  if (sender.isBanned()) {
      throw new BusinessRuleValidationException("Tu cuenta se encuentra suspendida temporalmente.");
  }
  if (recipient.isBanned()) {
      throw new BusinessRuleValidationException("El destinatario se encuentra suspendido.");
  }
  ```
- **Causa Raíz:**  
  1. No se comprueba `sender.getDeletedAt() != null` ni `recipient.getDeletedAt() != null`. Un usuario con cuenta dada de baja (soft delete) cuyo token JWT aún no haya caducado puede continuar enviando mensajes, o recibir mensajes de usuarios que ignoran que la cuenta ha sido eliminada.
  2. No se comprueba el estado del inmueble: `conversation.getListing().getBannedAt() != null` ni `conversation.getListing().getDeletedAt() != null`. Si un administrador banea de urgencia un anuncio por fraude o estafa, los participantes pueden continuar conversando en los chats ya creados, permitiendo al anfitrión consumar estafas pidiendo pagos externos.
- **Impacto:** Agujero de seguridad y vulnerabilidad de moderación frente a cuentas eliminadas o anuncios suspendidos por fraude.
- **Solución Recomendada:**  
  Incorporar en `validateCanSendMessage`:
  ```java
  if (sender.getDeletedAt() != null) {
      throw new BusinessRuleValidationException("Tu cuenta se encuentra dada de baja.");
  }
  if (recipient.getDeletedAt() != null) {
      throw new BusinessRuleValidationException("El destinatario se encuentra dado de baja.");
  }
  AccommodationListing listing = conversation.getListing();
  if (listing.getBannedAt() != null || listing.getDeletedAt() != null) {
      throw new BusinessRuleValidationException("El anuncio asociado a esta conversación ya no se encuentra disponible.");
  }
  ```

---

### [BLOQUEANTE] F-05: Exclusión total de denuncias sobre conversaciones en los informes administrativos
- **Ubicación:**  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/report/service/AdminReportServiceImpl.java` (Líneas 55-62)  
  `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/report/repository/ReportRepository.java` (Líneas 87-95)
- **Descripción:**  
  Al solicitar los objetivos más denunciados en `getMostReportedTargets`:
  ```java
  if (type == ReportTargetType.LISTING) {
      return reportRepository.findMostReportedListingsUnbanned(pageable);
  } else if (type == ReportTargetType.USER) {
      return reportRepository.findMostReportedUsersUnbanned(pageable);
  }
  return reportRepository.findAllMostReportedUnbanned(pageable);
  ```
- **Causa Raíz:**  
  Si el parámetro es `ReportTargetType.CONVERSATION`, se ejecuta el método genérico `findAllMostReportedUnbanned`. Sin embargo, la consulta SQL/JPQL de dicho método filtra explícitamente:
  ```sql
  WHERE (r.targetType = LISTING AND ...) OR (r.targetType = USER AND ...)
  ```
  Las denuncias de tipo `CONVERSATION` quedan 100% omitidas de los resultados de objetivos más denunciados.
- **Impacto:** Los administradores no pueden visualizar ni priorizar conversaciones que acumulen múltiples denuncias por acoso o fraude.
- **Solución Recomendada:**  
  Crear una consulta específica `findMostReportedConversations` o incluir `CONVERSATION` dentro de `findAllMostReportedUnbanned` comprobando la existencia de la conversación activa en BD.

---

### [BLOQUEANTE] F-06: Silenciamiento inadvertido de errores en el envío de mensajes en el frontend
- **Ubicación:** `Colivi-frontend/src/features/messaging/components/ChatWindow.tsx` (Líneas 99-104)
- **Descripción:**  
  En el gestor de envío del formulario:
  ```tsx
  try {
    await onSendMessage(textToSend);
  } catch {
    setInputText(textToSend);
  }
  ```
- **Causa Raíz:**  
  El bloque `catch` captura cualquier excepción arrojada por la API (HTTP 400 por expiración de 45 días, 403 por falta de permisos, 500 por caída de servidor) y únicamente restaura el texto en el `textarea`. No invoca ningún sistema de notificaciones (toast), ni activa un estado de error visible, ni informa al usuario del motivo del fallo.  
  Dado que en `useConversationChat` el mensaje optimista desaparece inmediatamente por el rollback de React Query, para el usuario el mensaje simplemente "se esfuma" del chat y reaparece en el cajón de entrada sin explicación.
- **Impacto:** Experiencia de usuario rota; el usuario no sabe si el mensaje se envió, si fue rechazado o si debe reintentar.
- **Solución Recomendada:**  
  Capturar el mensaje de error devuelto por el backend y exponerlo mediante un banner de error o toast en `ChatWindow.tsx`:
  ```tsx
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  ...
  try {
    setErrorMessage(null);
    await onSendMessage(textToSend);
  } catch (err: any) {
    setInputText(textToSend);
    setErrorMessage(err?.response?.data?.message || 'Error al enviar el mensaje');
  }
  ```

---

### [BLOQUEANTE] F-07: Supresión de eventos de dominio en transiciones de reserva no iniciadas en PENDING
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/bookingRequests/service/BookingRequestServiceImpl.java` (Líneas 143-154)
- **Descripción:**  
  Al actualizar el estado de una reserva:
  ```java
  boolean isRejected = request.getStatus() == RequestStatus.REJECTED;
  boolean isAccepted = request.getStatus() == RequestStatus.ACCEPTED;
  boolean isCancelled = request.getStatus() == RequestStatus.CANCELLED;

  if ((oldStatus == RequestStatus.PENDING && (isAccepted || isRejected)) || isCancelled) {
      BookingStatusChangedEvent event = new BookingStatusChangedEvent(...);
      eventPublisher.publishEvent(event);
  }
  ```
- **Causa Raíz:**  
  Si un administrador cambia manualmente el estado de una solicitud desde `ACCEPTED` a `REJECTED`, la condición `oldStatus == RequestStatus.PENDING` es falsa, e `isCancelled` es falsa. Como resultado, **no se publica el evento `BookingStatusChangedEvent`**.
- **Impacto:** `BookingStatusChangedListener` no recibe la notificación y la solicitud rechazada sigue enlazada como reserva activa en la conversación.
- **Solución Recomendada:**  
  Publicar el evento siempre que haya un cambio real de estado entre cualquier par de valores:
  ```java
  if (oldStatus != request.getStatus()) {
      eventPublisher.publishEvent(new BookingStatusChangedEvent(...));
  }
  ```

---

### [BLOQUEANTE] F-08: Manejo transaccional defectuoso ante colisiones concurrentes en `getOrCreateConsultation`
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/ConversationServiceImpl.java` (Líneas 110-116)
- **Descripción:**  
  ```java
  try {
      return conversationRepository.save(newConversation);
  } catch (DataIntegrityViolationException e) {
      log.warn("Conversación concurrente detectada...");
      return conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, host.getId(), listingId)
              .orElseThrow(() -> e);
  }
  ```
- **Causa Raíz:**  
  El método `getOrCreateConsultation` está anotado con `@Transactional`. Cuando Hibernate/JPA arroja una `DataIntegrityViolationException` (por violación de la restricción de unicidad `uk_conversation_tenant_host_listing`), la transacción de Spring subyacente queda marcada irreversiblemente como **`rollback-only`**.  
  Capturar la excepción en Java y ejecutar una consulta `findByTenantIdAndHostIdAndListingId` no limpia la marca de rollback. Al finalizar la ejecución del método, el interceptor transaccional de Spring intentará confirmar la transacción y lanzará un `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only`.
- **Impacto:** En situaciones de doble clic rápido o peticiones paralelas desde dos pestañas, la petición falla con error 500 en vez de devolver limpiamente la conversación ya creada.
- **Solución Recomendada:**  
  Extraer la inserción a un servicio independiente anotado con `Propagation.REQUIRES_NEW`, o utilizar un bloqueo pesimista/cerrojo distribuido antes de la persistencia.

---

## 4. Desglose de Fallos No Bloqueantes (Calidad, Rendimiento, UX y SOLID)

### [NO BLOQUEANTE] F-09: Consultas N+1 por carga perezosa de imágenes en `ConversationSummaryDto`
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/dto/ConversationSummaryDto.java` (Líneas 77-79)
- **Detalle:**  
  Al mapear cada elemento de la bandeja de entrada, `listing.getAccommodation().getImages().get(0)` invoca una colección perezosa (`LAZY`) que no está incluida en el `@EntityGraph` de `findInboxByUserId`. Cada conversación de la página realiza una consulta adicional a la tabla de imágenes. Al existir sondeo periódico cada 3 segundos en el cliente, este N+1 multiplica la carga innecesaria en base de datos.
- **Solución:** Incluir la URL de la primera imagen mediante una proyección DTO o añadir `"listing.accommodation.images"` con `FETCH` / `JOIN FETCH` optimizado en el repositorio.

---

### [NO BLOQUEANTE] F-10: Violación del principio Open/Closed e interpolación con valores `undefined` en `AdminReportDetailModal.tsx`
- **Ubicación:** `Colivi-frontend/src/features/admin/components/reports/AdminReportDetailModal.tsx` (Línea 180 y Líneas 142-155)
- **Detalle:**  
  1. En la línea 180: `${userSnippet.firstName} ${userSnippet.lastName}`. Si un usuario no posee segundo apellido o `lastName` llega nulo, JavaScript evalúa la cadena como `"Nombre undefined"`, mostrándose literalmente en el título del diálogo de confirmación de baneo. Ya existía en el mismo archivo la función utilitaria `formatUserFullName` que previene este error.
  2. En las líneas 142, 152 y 260: Las cadenas de confirmación utilizan ternarios binarios `${report.targetType === 'LISTING' ? 'este anuncio' : 'este usuario'}`. Al incorporarse `CONVERSATION`, los textos muestran "este usuario" para conversaciones denunciadas, violando el principio OCP.

---

### [NO BLOQUEANTE] F-11: Código duplicado e inalcanzable en `ConversationServiceImpl.java`
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/ConversationServiceImpl.java` (Líneas 60-62 y 83-85)
- **Detalle:**  
  La validación:
  ```java
  if (listing.getBannedAt() != null || listing.getDeletedAt() != null) {
      throw new BusinessRuleValidationException("El anuncio no se encuentra disponible.");
  }
  ```
  está escrita de forma idéntica en la línea 60 y repetida en la línea 83. El bloque de la línea 83 es código muerto redundante que nunca llegará a ejecutarse con una condición verdadera.

---

### [NO BLOQUEANTE] F-12: Consulta sin paginación de mensajes en el expediente administrativo
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/AdminConversationServiceImpl.java` (Línea 73)
- **Detalle:**  
  `messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conversationId)` vuelca todo el historial sin límite. En conversaciones que hayan acumulado miles de mensajes o sufrido ataques de spam, volcar el historial completo en una única petición HTTP genera picos de memoria e incrementa el tiempo de respuesta. Debe aplicarse un límite razonable (por ejemplo, últimos 200 mensajes) o paginación estándar.

---

### [NO BLOQUEANTE] F-13: Ausencia de feedback al usuario al fallar `startConsultation`
- **Ubicación:** `Colivi-frontend/src/features/housing/components/listing/ListingBookingCard.tsx` (Líneas 88-92) y `ListingHostCard.tsx` (Líneas 48-52)
- **Detalle:**  
  Al hacer clic en "Contactar / Preguntar", si la llamada a la API falla (por ejemplo, el usuario o anfitrión están suspendidos), el bloque `catch` solo imprime en consola (`console.error`). El botón deja de cargar y el usuario queda sin saber qué ha ocurrido. Conviene mostrar una notificación emergente o toast descriptivo.

---

### [NO BLOQUEANTE] F-14: Desalineación de preview y generación de falso mensaje no leído en Nudge del sistema
- **Ubicación:** `Colivi-backend/src/main/java/com/vvu981/colivibackend/features/messaging/service/MessageServiceImpl.java` (Líneas 64-90)
- **Detalle:**  
  Al dispararse el Nudge en el cuarto mensaje:
  1. No se actualiza `lastMessagePreview` ni `lastMessageAt` con el texto del Nudge del sistema; el Inbox sigue mostrando el texto del mensaje previo del usuario a pesar de que el último mensaje registrado en el chat es el aviso del sistema.
  2. Si el cuarto mensaje lo envía el inquilino, `claimNudge` incrementa inmediatamente en +1 el contador `tenantUnreadCount`. El inquilino verá en su bandeja de entrada un contador de 1 mensaje no leído provocado por su propia acción en tiempo real, lo que resulta confuso.

---

### [NO BLOQUEANTE] F-15: Sobrecarga por sondeo periódico concurrente a 3 segundos
- **Ubicación:** `Colivi-frontend/src/features/messaging/hooks/useMessagingInbox.ts` (Línea 15) y `useConversationChat.ts` (Línea 29)
- **Detalle:**  
  En `/messages/:id`, ambos hooks ejecutan sondeos independientes cada 3 segundos, sumando 40 peticiones HTTP por minuto por cada usuario con la página abierta. Se recomienda desacoplar la frecuencia (por ejemplo, dejar la lista en 10 segundos y la cabecera en 3-4 segundos) o evolucionar hacia Server-Sent Events (SSE).

---

## 5. Dictamen del Auditor y Recomendación Estratégica

La arquitectura propuesta presenta una base de modelado limpia y una clara separación de responsabilidades entre el servicio de conversación y el de mensajes. Los fallos identificados en la gestión de estados temporales (F-01), la cadena de eventos reactivos (F-02, F-07), la seguridad ante cuentas eliminadas y anuncios baneados (F-04), la resiliencia transaccional (F-08) y los fallos no bloqueantes de UX y rendimiento (F-05 a F-15) **han sido completamente subsanados y verificados**.

---

## 6. Estado de Subsanación y Verificación Técnica

| ID | Severidad | Estado | Resumen de la Solución Implementada | Pruebas de Verificación |
|---|---|---|---|---|
| **F-01** | BLOQUEANTE | RESUELTO | Cálculo de ventana de 45 días ajustado a la fecha de cancelación (`updatedAt`/`createdAt`) para reservas `CANCELLED`. | 21 pruebas unitarias en `MessageAccessPolicyValidatorTest` (100% PASS). |
| **F-02** | BLOQUEANTE | RESUELTO | `BookingConfirmedEventListener` ahora obtiene los IDs solapados, cancela las solicitudes y desvincula concurrentemente las conversaciones huérfanas mediante `ConversationRepository.unlinkBookingRequests`. | `BookingConfirmedEventListenerTest` (100% PASS). |
| **F-03** | BLOQUEANTE | RESUELTO | `syncActiveBookingRequest` sincroniza dinámicamente la solicitud activa y desvincula si ha dejado de estar activa (`CANCELLED`, `REJECTED`, etc.). | `ConversationServiceImplTest` (100% PASS). |
| **F-04** | BLOQUEANTE | RESUELTO | Añadida validación de borrado lógico en usuarios (`deletedAt != null`) y suspensión/eliminación en anuncios (`bannedAt != null \|\| deletedAt != null`) en `MessageAccessPolicyValidator`. | Pruebas específicas en `MessageAccessPolicyValidatorTest` (100% PASS). |
| **F-05** | BLOQUEANTE | RESUELTO | Agregada consulta JPQL `findMostReportedConversations` y soporte completo para `ReportTargetType.CONVERSATION` en moderación administrativa. | 25 pruebas unitarias en `AdminReportServiceImplTest` (100% PASS). |
| **F-06** | BLOQUEANTE | RESUELTO | Añadido estado `errorMessage`, captura de error en `handleSubmit` y banner accesible con `role="alert"` en `ChatWindow.tsx`. | Suite de pruebas en `ChatWindow.test.tsx` (100% PASS). |
| **F-07** | BLOQUEANTE | RESUELTO | `BookingRequestServiceImpl` emite `BookingStatusChangedEvent` en cualquier transición de estado cuando `oldStatus != request.getStatus()`. | 38 pruebas unitarias en `BookingRequestServiceImplTest` (100% PASS). |
| **F-08** | BLOQUEANTE | RESUELTO | `saveNewConversationSafely` aísla el guardado de la conversación en transacción independiente `REQUIRES_NEW` para evitar marcar en `rollback-only` la transacción principal ante colisiones de clave única. | `ConversationServiceImplTest` (100% PASS). |
| **F-09** | NO BLOQUEANTE | VERIFICADO | `@BatchSize(size = 50)` en `Accommodation.images` mitiga el problema N+1 sin incurrir en `MultipleBagFetchException` ni alertas de paginación en memoria de Hibernate. | Verificación de mapeo JPA y rendimiento. |
| **F-10** | NO BLOQUEANTE | RESUELTO | Reemplazado switch rígido por funciones auxiliares (`getTargetDemonstrative`, `getTargetDefiniteArticle`, `getTargetCapitalizedNoun`) y resuelto fallback seguro en `formatUserFullName`. | `AdminReportDetailModal.test.tsx` (100% PASS). |
| **F-11** | NO BLOQUEANTE | RESUELTO | Eliminado chequeo redundante y duplicado de anuncio suspendido/eliminado en `ConversationServiceImpl.java`. | Revisión de código y compilación limpia. |
| **F-12** | NO BLOQUEANTE | RESUELTO | Añadido método de repositorio paginado `findTopMessagesByConversationId` limitando a un máximo de 200 mensajes en el expediente administrativo. | `AdminConversationServiceImplTest` (100% PASS). |
| **F-13** | NO BLOQUEANTE | RESUELTO | Añadido manejo de excepciones y banners de error accesibles (`role="alert"`) en `ListingBookingCard.tsx` y `ListingHostCard.tsx` ante fallos de inicio de consulta. | Pruebas añadidas en `ListingHostCard.test.tsx` (100% PASS). |
| **F-14** | NO BLOQUEANTE | RESUELTO | El Nudge ahora actualiza la previsualización (`lastMessagePreview`) con el aviso del sistema y solo incrementa `tenantUnreadCount` cuando el cuarto mensaje proviene del anfitrión. | `MessageServiceImplTest` (100% PASS). |
| **F-15** | NO BLOQUEANTE | RESUELTO | Polling de listado de bandeja de entrada relajado de 3000ms a 8000ms en `useMessagingInbox.ts`, reservando el sondeo de 3000ms únicamente para la cabecera activa en conversación abierta. | Suite de hooks en frontend (100% PASS). |

### Resultado Final de Validación:
- **Backend:** `mvn clean test` ejecutado satisfactoriamente (1093 pruebas ejecutadas, 0 fallos, 0 errores, BUILD SUCCESS).
- **Frontend:** `npm run test:run` ejecutado satisfactoriamente (82 suites de prueba, 340 pruebas pasadas, 100% éxito).
- **Linter Frontend:** `npm run lint` ejecutado satisfactoriamente (0 errores, 0 warnings).
- **Estado de la Pull Request:** **APROBADA** tras subsanación integral de los 15 hallazgos.
