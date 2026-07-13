package com.vvu981.colivibackend.features.bookingRequests.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookingRequestServiceImpl implements BookingRequestService {

    private final BookingRequestRepository requestRepository;
    private final AccommodationListingRepository listingRepository;
    private final UserRepository userRepository;

    private final List<BookingRequestFilter> bookingFilters;

    @Override
    public BookingRequestResponseDto createBookingRequest(BookingRequestDto requestDto, UUID currentUser) {
        User currUser = findUser(currentUser);

        if (currUser.isBanned() || (currUser.getDeletedAt() != null))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Error: estas baneado o eliminado.");

        AccommodationListing listing = findListingAssociated(requestDto.accommodationListingId());
        
        if (listing.getBannedAt() != null || listing.getDeletedAt() != null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error: el anuncio esta eliminado o baneado.");
            
        if (listing.getStatus() != ListingStatus.AVAILABLE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error: el anuncio no esta disponible actualmente.");

        if (currUser.getId().equals(listing.getHost().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error: no puedes solicitar una reserva en tu propio anuncio.");
        }

        BookingRequest requestToCreate = new BookingRequest(requestDto, currUser, listing);

        requestRepository.save(requestToCreate);

        return new BookingRequestResponseDto(requestToCreate);
    }

    @Override
    public BookingRequestResponseDto setStatusBookingRequest(RequestStatus requestStatus, UUID requestId,
            UUID currentUser) {
        User currUser = findUser(currentUser);
        BookingRequest request = findById(requestId);

        try {
            processStatusChange(request, requestStatus, currUser);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        requestRepository.save(request);
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

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Error: No tienes permiso para editar esta solicitud.");
    }

    private void handleTenantStatusChange(BookingRequest request, RequestStatus newStatus) {
        if (newStatus != RequestStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Error: como inquilino solo puedes cancelar la solicitud.");
        }
        request.cancel();
    }

    private void handleHostStatusChange(BookingRequest request, RequestStatus newStatus) {
        if (newStatus == RequestStatus.ACCEPTED) {
            request.accept();
        } else if (newStatus == RequestStatus.REJECTED) {
            request.reject();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Error: como propietario solo puedes aceptar o rechazar la solicitud.");
        }
    }

    private BookingRequest findById(UUID requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Error: no se encuentra la solicitud con id:" + requestId));
    }

    private AccommodationListing findListingAssociated(UUID listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Error: no se encuentra el anuncio con id: " + listingId));
    }

    private User findUser(UUID currentUser) {
        return userRepository.findByIdAndDeletedAtIsNull(currentUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Error: no se encuentra el usuario con id: " + currentUser));
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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Error: No tienes permiso para ver esta solicitud.");
        }

        BookingRequestResponseDto response = new BookingRequestResponseDto(request);

        return response;

    }

    // inquilino o arrendatario
    @Override
    public Page<BookingRequestResponseDto> getTenantBookingRequests(int page, int size, UUID tenantId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return requestRepository.findByRequesterId(tenantId, pageable)
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

        Specification<BookingRequest> finalSpec = Specification.where(null);

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

}
