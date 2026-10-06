# Diagramas de Secuencia del Sistema - Plataforma Colivi

Documento de especificación de interacciones dinámicas del sistema conforme al estándar UML 2.5, implementado en sintaxis **Mermaid** para renderizado nativo directo en GitHub, GitLab, VS Code y visores Markdown.

Cada diagrama modela de forma exhaustiva las llamadas síncronas y asíncronas entre la capa de presentación (`Colivi-frontend`), los controladores REST, los servicios de aplicación, la capa de persistencia (`JPA/Hibernate`), los eventos de dominio (`Spring Application Events`) y los sistemas externos (`Cloudinary`, `SMTP`, `Nominatim`).

---

## 1. Recuperación de Contraseña (Password Reset Flow)

Flujo desacoplado en dos fases independientes para garantizar la seguridad del sistema y prevenir ataques de enumeración de usuarios (*Anti User-Enumeration Attack*).

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Usuario Invitado
    participant Frontend as Cliente Web (React)
    
    box rgb(235, 245, 251) Capa de Aplicación (Spring Boot)
        participant Controller as AuthController
        participant Service as UserServiceImpl
        participant Events as ApplicationEventPublisher
        participant Listener as PasswordResetListener
        participant EmailService as EmailService
    end

    box rgb(234, 250, 241) Capa de Datos (PostgreSQL)
        participant UserRepo as UserRepository
    end

    actor SMTP as Servidor SMTP (Externo)

    %% FASE 1: Solicitud
    rect rgb(245, 247, 250)
        Note over Guest, SMTP: FASE 1: Solicitud de Restablecimiento (Forgot Password)
        Guest->>Frontend: Introduce email y pulsa "Recuperar contraseña"
        activate Frontend
        Frontend->>Controller: POST /api/v1/auth/forgot-password { email }
        activate Controller
        Controller->>Service: forgotPassword(email)
        activate Service
        
        Service->>UserRepo: findByEmail(email)
        activate UserRepo
        UserRepo-->>Service: Optional<User>
        deactivate UserRepo

        alt Usuario no existe o está inactivo / baneado
            Service->>Service: Log warning silencioso (Prevención de enumeración)
            Service-->>Controller: void
            Controller-->>Frontend: 200 OK (Cuerpo vacío)
            Frontend-->>Guest: Mensaje genérico: "Si el correo existe, recibirás instrucciones"
        else Usuario válido y activo
            Service->>Service: Generar token UUID seguro
            Service->>Service: user.setPasswordResetToken(token)
            Service->>Service: user.setPasswordResetTokenExpiresAt(now + 24h)
            Service->>UserRepo: save(user)
            
            Service->>Events: publishEvent(UserPasswordResetRequestedEvent)
            activate Events
            Events->>Listener: onPasswordResetRequested(event)
            activate Listener
            Listener->>EmailService: sendPasswordResetEmail(email, token)
            activate EmailService
            EmailService->>SMTP: Envía correo con enlace temporal
            SMTP-->>EmailService: Correo aceptado
            EmailService-->>Listener: void
            deactivate EmailService
            deactivate Listener
            deactivate Events

            Service-->>Controller: void
            deactivate Service
            Controller-->>Frontend: 200 OK
            deactivate Controller
            Frontend-->>Guest: Muestra confirmación de envío
        end
        deactivate Frontend
    end

    %% FASE 2: Consumo
    rect rgb(255, 255, 255)
        Note over Guest, SMTP: FASE 2: Consumo de Token y Nueva Contraseña (Reset Password)
        Guest->>Frontend: Accede a /reset-password?token=XYZ e introduce nueva clave
        activate Frontend
        Frontend->>Controller: POST /api/v1/auth/reset-password { token, newPassword }
        activate Controller
        Controller->>Service: resetPassword(token, newPassword)
        activate Service
        Service->>UserRepo: findByPasswordResetToken(token)
        activate UserRepo
        UserRepo-->>Service: Optional<User>
        deactivate UserRepo

        alt Token no encontrado en BD
            Service-->>Controller: throw ResourceNotFoundException("Usuario no encontrado")
            Controller-->>Frontend: 404 Not Found
            Frontend-->>Guest: "El enlace no es válido"
        else Token expirado (now > expiresAt)
            Service-->>Controller: throw InvalidTokenException("Token has expired")
            Controller-->>Frontend: 400 Bad Request
            Frontend-->>Guest: "El enlace ha caducado, solicita uno nuevo"
        else Token íntegro y vigente
            Service->>Service: passwordEncoder.encode(newPassword)
            Service->>Service: user.setPasswordHash(hashedPassword)
            Service->>Service: user.setPasswordResetToken(null)
            Service->>Service: user.setPasswordResetTokenExpiresAt(null)
            Service->>UserRepo: save(user)
            activate UserRepo
            UserRepo-->>Service: User actualizado
            deactivate UserRepo

            Service-->>Controller: void
            deactivate Service
            Controller-->>Frontend: 204 No Content
            deactivate Controller
            Frontend-->>Guest: Redirige a /login con aviso de éxito
        end
        deactivate Frontend
    end
```

---

## 2. Valorar un Anuncio (Review Submission Flow)

Modela la regla de negocio que exige reserva en estado `CONFIRMED` y estancia iniciada antes de admitir una valoración.

```mermaid
sequenceDiagram
    autonumber
    actor Tenant as Inquilino (Tenant)
    participant Frontend as Cliente Web (React)

    box rgb(235, 245, 251) Capa de Aplicación (Spring Boot)
        participant Controller as AccommodationReviewController
        participant Service as AccommodationReviewServiceImpl
    end

    box rgb(234, 250, 241) Capa de Datos (PostgreSQL)
        participant ListingRepo as AccommodationListingRepository
        participant BookingRepo as BookingRequestRepository
        participant ReviewRepo as AccommodationReviewRepository
    end

    Tenant->>Frontend: Selecciona puntuación (1-5) y redacta comentario
    activate Frontend
    Frontend->>Controller: POST /api/v1/listings/{listingId}/reviews (Bearer JWT)
    activate Controller
    Controller->>Service: createReview(listingId, request, currentUserId)
    activate Service

    alt Usuario no autenticado (currentUserId == null)
        Service-->>Controller: throw UnauthorizedActionException("Usuario no autenticado")
        Controller-->>Frontend: 401 Unauthorized
        Frontend-->>Tenant: Redirige al inicio de sesión
    end

    Service->>ListingRepo: findById(listingId)
    activate ListingRepo
    ListingRepo-->>Service: Optional<AccommodationListing>
    deactivate ListingRepo

    alt Anuncio no existe
        Service-->>Controller: throw ResourceNotFoundException("Anuncio no encontrado")
        Controller-->>Frontend: 404 Not Found
    end

    %% Validación de reserva confirmada
    Service->>BookingRepo: findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(currentUserId, listingId, CONFIRMED)
    activate BookingRepo
    BookingRepo-->>Service: Optional<BookingRequest>
    deactivate BookingRepo

    alt Sin reserva confirmada
        Service-->>Controller: throw BusinessRuleValidationException("Solo inquilinos con reserva confirmada...")
        Controller-->>Frontend: 400 Bad Request
        Frontend-->>Tenant: Notifica falta de reserva válida
    end

    %% Validación de fecha de estancia
    alt Estancia aún no iniciada (startDate > now)
        Service-->>Controller: throw BusinessRuleValidationException("No puedes valorar antes del inicio de tu estancia")
        Controller-->>Frontend: 400 Bad Request
        Frontend-->>Tenant: "Tu estancia todavía no ha comenzado"
    end

    %% Validación de no duplicidad
    Service->>ReviewRepo: existsByBookingRequestId(booking.id)
    activate ReviewRepo
    ReviewRepo-->>Service: boolean
    deactivate ReviewRepo
    alt Ya existe valoración para esta estancia
        Service-->>Controller: throw BusinessRuleValidationException("Ya has emitido valoración para esta estancia")
        Controller-->>Frontend: 400 Bad Request
    end

    Service->>ReviewRepo: existsByAuthorIdAndListingId(currentUserId, listingId)
    activate ReviewRepo
    ReviewRepo-->>Service: boolean
    deactivate ReviewRepo
    alt Ya existe valoración previa para este anuncio
        Service-->>Controller: throw BusinessRuleValidationException("Ya has publicado valoración para este anuncio")
        Controller-->>Frontend: 400 Bad Request
    end

    %% Persistencia
    Service->>Service: AccommodationReview.builder().rating().comment().build()
    Service->>ReviewRepo: save(review)
    activate ReviewRepo
    ReviewRepo-->>Service: AccommodationReview guardado
    deactivate ReviewRepo

    Service-->>Controller: ReviewResponse
    deactivate Service
    Controller-->>Frontend: 201 Created (ReviewResponse)
    deactivate Controller
    Frontend-->>Tenant: Inserta reseña en el listado y muestra notificación de éxito
    deactivate Frontend
```

---

## 3. Solicitud de Reserva (Booking Request Submission Flow)

Modela la solicitud transaccional, las validaciones de calendario y la emisión desacoplada de eventos de dominio (`ApplicationEventPublisher`) hacia el correo y el chat.

```mermaid
sequenceDiagram
    autonumber
    actor Tenant as Inquilino (Tenant)
    participant Frontend as Cliente Web (React)

    box rgb(235, 245, 251) Capa de Aplicación (Spring Boot)
        participant Controller as BookingRequestController
        participant Service as BookingRequestServiceImpl
        participant Validator as BookingRequestValidator
        participant Events as ApplicationEventPublisher
        participant EmailListener as BookingNotificationListener
        participant ChatListener as BookingStatusChangedListener
        participant EmailService as EmailService
    end

    box rgb(234, 250, 241) Capa de Datos (PostgreSQL)
        participant UserRepo as UserRepository
        participant ListingRepo as AccommodationListingRepository
        participant BookingRepo as BookingRequestRepository
    end

    Tenant->>Frontend: Selecciona fechas (startDate, endDate) y pulsa "Solicitar Reserva"
    activate Frontend
    Frontend->>Controller: POST /api/v1/booking-requests (Bearer JWT) { listingId, startDate, endDate, message }
    activate Controller
    Controller->>Service: createBookingRequest(requestDto, currentUserId)
    activate Service

    %% 1. Validar Usuario
    Service->>UserRepo: findActiveById(currentUserId)
    activate UserRepo
    UserRepo-->>Service: Optional<User>
    deactivate UserRepo
    alt Usuario baneado o borrado lógicamente
        Service-->>Controller: throw UnauthorizedActionException("Estás baneado o eliminado")
        Controller-->>Frontend: 403 Forbidden
    end

    %% 2. Validar Anuncio
    Service->>ListingRepo: findById(listingId)
    activate ListingRepo
    ListingRepo-->>Service: Optional<AccommodationListing>
    deactivate ListingRepo
    alt Anuncio no disponible o eliminado
        Service-->>Controller: throw BusinessRuleValidationException("El anuncio no está disponible actualmente")
        Controller-->>Frontend: 400 Bad Request
    end
    alt El solicitante es el dueño del anuncio
        Service-->>Controller: throw BusinessRuleValidationException("No puedes solicitar reserva en tu propio anuncio")
        Controller-->>Frontend: 400 Bad Request
    end

    %% 3. Validar duplicidad activa
    Service->>BookingRepo: existsActiveRequestByUserAndListing(currentUserId, listingId)
    activate BookingRepo
    BookingRepo-->>Service: boolean
    deactivate BookingRepo
    alt Ya tiene solicitud en curso
        Service-->>Controller: throw BusinessRuleValidationException("Ya tienes una solicitud en curso para este anuncio")
        Controller-->>Frontend: 400 Bad Request
    end

    %% 4. Validación de fechas
    Service->>Validator: validateBookingDates(startDate, endDate, listing)
    activate Validator
    Validator-->>Service: Rango de fechas válido
    deactivate Validator

    %% 5. Persistencia
    Service->>Service: new BookingRequest(requestDto, user, listing) [Status: PENDING]
    Service->>BookingRepo: save(requestToCreate)
    activate BookingRepo
    BookingRepo-->>Service: BookingRequest guardado
    deactivate BookingRepo

    %% 6. Eventos de Dominio Asíncronos
    Service->>Events: publishEvent(BookingRequestCreatedEvent)
    activate Events

    par Notificación Email al Anfitrión
        Events->>EmailListener: handleBookingRequestCreated(event)
        activate EmailListener
        EmailListener->>EmailService: sendBookingRequestNotification(...)
        activate EmailService
        EmailService-->>EmailListener: void
        deactivate EmailService
        deactivate EmailListener
    and Integración con Chat Contextual
        Events->>ChatListener: onBookingRequestCreated(event)
        activate ChatListener
        ChatListener->>ChatListener: Inserta mensaje informativo en conversación
        deactivate ChatListener
    end

    deactivate Events

    Service-->>Controller: BookingRequestResponseDto
    deactivate Service
    Controller-->>Frontend: 201 Created (BookingRequestResponseDto)
    deactivate Controller
    Frontend-->>Tenant: Muestra confirmación de solicitud enviada
    deactivate Frontend
```

---

## 4. Creación de Alojamiento (Accommodation Creation & Media Storage Flow)

Modela el proceso en dos pasos: geocodificación interactiva con Nominatim/OSM, persistencia del inmueble base y almacenamiento en Cloudinary con compensación transaccional ante fallos de base de datos (*Storage Leak Prevention*).

```mermaid
sequenceDiagram
    autonumber
    actor Host as Anfitrión (Host)
    participant Frontend as Cliente Web (React / MapPicker)
    actor ExtOSM as Nominatim / OSM (Cartografía)

    box rgb(235, 245, 251) Capa de Aplicación (Spring Boot)
        participant Controller as AccommodationController
        participant Service as AccommodationServiceImpl
        participant TxSync as TransactionSynchronizationManager
        participant CloudinaryService as CloudinaryImageStorageService
    end

    box rgb(234, 250, 241) Capa de Datos (PostgreSQL)
        participant UserRepo as UserRepository
        participant AccomRepo as AccommodationRepository
    end

    actor ExtCloudinary as Cloudinary CDN (Almacenamiento)

    %% PASO 1: Inmueble Base
    rect rgb(245, 247, 250)
        Note over Host, ExtCloudinary: PASO 1: Geocodificación y Alta del Inmueble Base
        Host->>Frontend: Introduce dirección física en el formulario
        activate Frontend
        Frontend->>ExtOSM: Geocoding Request (Query Address)
        activate ExtOSM
        ExtOSM-->>Frontend: Retorna { latitude, longitude, postalCode, city, province }
        deactivate ExtOSM
        Frontend-->>Host: Muestra ubicación exacta en mapa Leaflet

        Host->>Frontend: Rellena características (m2, habitaciones, baños) y pulsa "Guardar"
        Frontend->>Controller: POST /api/v1/accommodation (Bearer JWT) { address, coords, amenities... }
        activate Controller
        Controller->>Service: createAccommodation(request, currentUserId)
        activate Service

        Service->>UserRepo: getReferenceById(currentUserId)
        activate UserRepo
        UserRepo-->>Service: User owner (Proxy JPA)
        deactivate UserRepo

        Service->>Service: new Accommodation(request, owner)
        Service->>AccomRepo: save(accommodationToCreate)
        activate AccomRepo
        AccomRepo-->>Service: Accommodation guardado (id generado)
        deactivate AccomRepo

        Service-->>Controller: AccommodationResponse
        deactivate Service
        Controller-->>Frontend: 201 Created (AccommodationResponse)
        deactivate Controller
        Frontend-->>Host: Transiciona automáticamente al Paso 2: "Subir Galería"
        deactivate Frontend
    end

    %% PASO 2: Imágenes y Compensación
    rect rgb(255, 255, 255)
        Note over Host, ExtCloudinary: PASO 2: Subida de Imágenes con Compensación Transaccional
        Host->>Frontend: Selecciona imagen y pulsa "Subir Foto"
        activate Frontend
        Frontend->>Controller: POST /api/v1/accommodation/{id}/images (Multipart file)
        activate Controller
        Controller->>Service: addImageToAccommodation(id, file, currentUserId)
        activate Service

        Service->>AccomRepo: findAccommodationByIdAndDeletedAtIsNull(id)
        activate AccomRepo
        AccomRepo-->>Service: Accommodation
        deactivate AccomRepo

        Service->>Service: canEdit(accommodation, currentUser)

        Service->>CloudinaryService: uploadImage(file)
        activate CloudinaryService
        CloudinaryService->>ExtCloudinary: Upload binary payload
        activate ExtCloudinary
        ExtCloudinary-->>CloudinaryService: Retorna secure_url pública
        deactivate ExtCloudinary
        CloudinaryService-->>Service: secureUrl
        deactivate CloudinaryService

        Service->>TxSync: registerSynchronization(afterCompletion)
        Note over Service, TxSync: Si la BD hace rollback, purga la imagen de Cloudinary

        Service->>Service: AccommodationImage.builder().imageUrl(secureUrl).build()
        Service->>Service: accommodation.getImages().add(imageEntity)
        Service->>AccomRepo: save(accommodation)
        activate AccomRepo

        alt Error imprevisto en persistencia (Rollback BD)
            AccomRepo-->>Service: DataIntegrityViolationException
            TxSync->>CloudinaryService: deleteImage(secureUrl)
            CloudinaryService->>ExtCloudinary: Purgar imagen huérfana de Cloudinary
            Service-->>Controller: throw InternalServerErrorException
            Controller-->>Frontend: 500 Internal Server Error
            Frontend-->>Host: Informa de fallo en la subida y revierte cambios
        else Transacción confirmada (Commit)
            AccomRepo-->>Service: Accommodation actualizado
            deactivate AccomRepo
            Service-->>Controller: AccommodationResponse
            deactivate Service
            Controller-->>Frontend: 200 OK (AccommodationResponse)
            deactivate Controller
            Frontend-->>Host: Muestra foto en galería interactiva
        end
        deactivate Frontend
    end
```
