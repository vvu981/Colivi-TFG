package com.vvu981.colivibackend.features.bookingRequests.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestResponseDto;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.bookingRequests.repository.filters.BookingRequestFilter;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
import com.vvu981.colivibackend.features.bookingRequests.dto.PaymentConfirmationDto;
import com.vvu981.colivibackend.core.payment.service.PaymentService;
import org.springframework.context.ApplicationEventPublisher;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingRequestServiceImpl implements BookingRequestService {

    private final BookingRequestRepository requestRepository;
    private final AccommodationListingRepository listingRepository;
    private final UserRepository userRepository;
    private final AccommodationRepository accommodationRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PaymentService paymentService;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    private final BookingRequestValidator bookingRequestValidator;

    private final List<BookingRequestFilter> bookingFilters;

    @org.springframework.transaction.annotation.Transactional
    @Override
    public BookingRequestResponseDto createBookingRequest(BookingRequestDto requestDto, UUID currentUser) {
        User currUser = findUser(currentUser);

        if (currUser.isBanned() || (currUser.getDeletedAt() != null))
            throw new UnauthorizedActionException("Error: estas baneado o eliminado.");

        AccommodationListing listing = findListingById(requestDto.accommodationListingId());

        if (listing.getBannedAt() != null || listing.getDeletedAt() != null)
            throw new BusinessRuleValidationException("Error: el anuncio esta eliminado o baneado.");

        if (listing.getStatus() != ListingStatus.AVAILABLE)
            throw new BusinessRuleValidationException("Error: el anuncio no esta disponible actualmente.");

        if (currUser.getId().equals(listing.getHost().getId())) {
            throw new BusinessRuleValidationException("Error: no puedes solicitar una reserva en tu propio anuncio.");
        }

        if (requestRepository.existsActiveRequestByUserAndListing(currUser.getId(), listing.getId())) {
            throw new BusinessRuleValidationException(
                    "Error: ya tienes una solicitud en curso o aceptada para este anuncio.");
        }

        bookingRequestValidator.validateBookingDates(requestDto.startDate(), requestDto.endDate(), listing);

        BookingRequest requestToCreate = new BookingRequest(requestDto, currUser, listing);

        BookingRequest savedRequest = requestRepository.save(requestToCreate);

        String tenantFullName = currUser.getFirstName() != null
                ? currUser.getFirstName() + (currUser.getLastName1() != null ? " " + currUser.getLastName1() : "")
                : currUser.getNickname();

        eventPublisher.publishEvent(new com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent(
                listing.getHost().getEmail(),
                tenantFullName,
                listing.getTitle(),
                savedRequest.getStartDate(),
                savedRequest.getEndDate(),
                savedRequest.getMessage()
        ));

        return new BookingRequestResponseDto(savedRequest);
    }

    @Override
    @Transactional // Aseguramos que todo ocurra dentro de una transacción para que el bloqueo de
                   // base de datos sea efectivo
    public BookingRequestResponseDto setStatusBookingRequest(RequestStatus requestStatus, UUID requestId,
            UUID currentUser) {
        User currUser = findUser(currentUser);
        BookingRequest request = findById(requestId);
        RequestStatus oldStatus = request.getStatus();

        // CONTROL DE EXCESO DE RESERVAS EN LA ACEPTACIÓN MANUAL
        // Si el estado de destino es ACCEPTED, obligamos al sistema a comprobar de
        // nuevo
        // si quedan habitaciones libres para este rango de meses.
        // Esto evita el overbooking si el casero acepta dos solicitudes pendientes
        // consecutivas.
        if (requestStatus == RequestStatus.ACCEPTED) {
            listingRepository.findByIdWithPessimisticLock(request.getAccommodationListing().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Error: no se encuentra el anuncio"));
            bookingRequestValidator.validateBookingDates(
                    request.getStartDate(),
                    request.getEndDate(),
                    request.getAccommodationListing());
        }

        try {
            processStatusChange(request, requestStatus, currUser);
        } catch (IllegalStateException e) {
            throw new BusinessRuleValidationException(e.getMessage());
        }

        requestRepository.save(request);

        if (oldStatus == RequestStatus.PENDING &&
                (request.getStatus() == RequestStatus.ACCEPTED || request.getStatus() == RequestStatus.REJECTED)) {
            BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                    request.getRequester().getEmail(),
                    request.getAccommodationListing().getTitle(),
                    request.getStatus(),
                    request.getStatus() == RequestStatus.ACCEPTED,
                    request.getExpiresAt());
            eventPublisher.publishEvent(event);
        }

        return new BookingRequestResponseDto(request);
    }

    private void processStatusChange(BookingRequest request, RequestStatus newStatus, User currUser) {
        if (currUser.getRole().equals(UserRole.ADMIN)) {
            request.setStatus(newStatus);
            return;
        }

        if (currUser.getId().equals(request.getRequester().getId())) {
            handleTenantStatusChange(request, newStatus);
            return;
        }

        if (currUser.getId().equals(request.getAccommodationListing().getHost().getId())) {
            handleHostStatusChange(request, newStatus);
            return;
        }

        throw new UnauthorizedActionException("Error: No tienes permiso para editar esta solicitud.");
    }

    private void handleTenantStatusChange(BookingRequest request, RequestStatus newStatus) {
        if (newStatus != RequestStatus.CANCELLED) {
            throw new UnauthorizedActionException("Error: como inquilino solo puedes cancelar la solicitud.");
        }
        request.cancel();
    }

    private void handleHostStatusChange(BookingRequest request, RequestStatus newStatus) {
        if (newStatus == RequestStatus.ACCEPTED) {
            long overlapping = requestRepository.countOverlappingAcceptedBookings(
                    request.getAccommodationListing().getId(),
                    request.getStartDate(),
                    request.getEndDate());
            if (overlapping > 0) {
                throw new BusinessRuleValidationException(
                        "No puedes aceptar esta solicitud porque ya tienes otra solicitud aceptada que solapa en fechas.");
            }
            request.accept();
        } else if (newStatus == RequestStatus.REJECTED) {
            request.reject();
        } else {
            throw new UnauthorizedActionException(
                    "Error: como propietario solo puedes aceptar o rechazar la solicitud.");
        }
    }

    private BookingRequest findById(UUID requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Error: no se encuentra la solicitud con id:" + requestId));
    }

    private AccommodationListing findListingById(UUID listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Error: no se encuentra el anuncio con id: " + listingId));
    }

    private User findUser(UUID currentUser) {
        return userRepository.findActiveById(currentUser)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Error: no se encuentra el usuario con id: " + currentUser));
    }

    @Override
    public BookingRequestResponseDto confirmBookingPayment(UUID requestId, PaymentConfirmationDto paymentDto,
            UUID currentUserId) {

        java.math.BigDecimal totalToPay = transactionTemplate.execute(status -> {
            BookingRequest request = findById(requestId);

            if (!request.getRequester().getId().equals(currentUserId)) {
                throw new UnauthorizedActionException(
                        "Error: solo el inquilino que creó la solicitud puede confirmar el pago.");
            }

            if (request.getStatus() != RequestStatus.ACCEPTED) {
                throw new BusinessRuleValidationException("Solo puedes pagar reservas que hayan sido aceptadas.");
            }

            if (request.getAccommodationListing().getStatus() != ListingStatus.AVAILABLE) {
                throw new BusinessRuleValidationException("El alojamiento ya no está disponible.");
            }

            return request.getAccommodationListing().getPricePerMonth()
                    .add(request.getAccommodationListing().getSecurityDeposit());
        });

        String transactionId;
        try {
            transactionId = paymentService.processPayment(paymentDto.paymentToken(), totalToPay);
        } catch (Exception e) {
            throw new BusinessRuleValidationException(e.getMessage());
        }

        try {
            return transactionTemplate.execute(status -> {
                BookingRequest request = findById(requestId);
                AccommodationListing listing = listingRepository
                        .findByIdWithPessimisticLock(request.getAccommodationListing().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Error: no se encuentra el anuncio."));

                if (listing.getStatus() != ListingStatus.AVAILABLE) {
                    throw new BusinessRuleValidationException("El alojamiento ya no está disponible.");
                }

                try {
                    request.confirm(transactionId, paymentDto.paymentMethod());
                } catch (IllegalStateException e) {
                    throw new BusinessRuleValidationException(e.getMessage());
                }

                listing.setStatus(ListingStatus.UNAVAILABLE);
                listingRepository.save(listing);

                BookingRequest savedRequest = requestRepository.save(request);

                eventPublisher.publishEvent(new BookingConfirmedEvent(
                        listing.getId(),
                        savedRequest.getId(),
                        savedRequest.getStartDate(),
                        savedRequest.getEndDate(),
                        savedRequest.getRequester().getEmail(),
                        listing.getHost().getEmail(),
                        listing.getTitle()));

                return new BookingRequestResponseDto(savedRequest);
            });
        } catch (Exception ex) {
            paymentService.refund(transactionId);
            throw new BusinessRuleValidationException(
                    "La reserva no pudo completarse debido a un cambio de disponibilidad. Tu pago ha sido reembolsado.");
        }
    }

    @Override
    public BookingRequestResponseDto getBookingRequestById(UUID requestId, UUID currentUser) {
        User currUser = findUser(currentUser);
        BookingRequest request = findById(requestId);
        boolean isAdmin = currUser.getRole().equals(UserRole.ADMIN);
        User requestOwner = request.getRequester();
        User listingOwner = request.getAccommodationListing().getHost();

        if (!isAdmin && !currUser.getId().equals(listingOwner.getId())
                && !currUser.getId().equals(requestOwner.getId())) {
            throw new UnauthorizedActionException("Error: No tienes permiso para ver esta solicitud.");
        }

        BookingRequestResponseDto response = new BookingRequestResponseDto(request);

        return response;

    }

    // inquilino o arrendatario
    @Override
    public Page<BookingRequestResponseDto> getTenantBookingRequests(int page, int size, UUID tenantId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return requestRepository.findByRequesterIdAndStatusNot(tenantId, RequestStatus.CANCELLED, pageable)
                .map(BookingRequestResponseDto::new);
    }

    // arrendador
    @Override
    public Page<BookingRequestResponseDto> getLandlordBookingRequests(int page, int size, UUID landlordId,
            UUID listingId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        BookingRequestAdminFilterDto temporalFilterDto = new BookingRequestAdminFilterDto(
                listingId, // accommodationListingId (puede ser null)
                null, // requesterId
                landlordId, // hostId (El ID del casero actual logueado)
                null, // status
                null // startDate
        );

        Specification<BookingRequest> finalSpec = Specification
                .where((root, query, cb) -> cb.notEqual(root.get("status"), RequestStatus.CANCELLED));

        for (BookingRequestFilter filter : bookingFilters) {
            if (filter.isApplicable(temporalFilterDto)) {
                finalSpec = finalSpec.and(filter.buildSpecification(temporalFilterDto));
            }
        }

        // 5. Ejecutamos la consulta final unificada en la base de datos
        return requestRepository.findAll(finalSpec, pageable)
                .map(BookingRequestResponseDto::new);
    }

    @Override
    public Page<BookingRequestResponseDto> getAllBookingRequestsForAdmin(
            BookingRequestAdminFilterDto filterDto, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Specification<BookingRequest> finalSpec = Specification.where(null);

        // Spring recorre los 5 componentes @Component inyectados automáticamente
        for (BookingRequestFilter filter : bookingFilters) {
            if (filter.isApplicable(filterDto)) {
                finalSpec = finalSpec.and(filter.buildSpecification(filterDto));
            }
        }

        return requestRepository.findAll(finalSpec, pageable)
                .map(BookingRequestResponseDto::new);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingRequestsForLandlord(UUID landlordId) {
        return requestRepository.countPendingRequestsByHostId(landlordId);
    }

}
