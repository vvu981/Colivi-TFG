package com.vvu981.colivibackend.features.bookingRequests.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
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
            throw new RuntimeException("Error: estas baneado o eliminado.");

        AccommodationListing listing = findListingAssociated(requestDto.accommodationListingId());
        if (listing.getBannedAt() != null || listing.getDeletedAt() != null)
            throw new RuntimeException("Error: el listing esta eliminado o baneado.");
        BookingRequest requestToCreate = new BookingRequest(requestDto, currUser, listing);

        requestRepository.save(requestToCreate);

        return new BookingRequestResponseDto(requestToCreate);
    }

    @Override
    public BookingRequestResponseDto setStatusBookingRequest(RequestStatus requestStatus, UUID requestId,
            UUID currentUser) {
        User currUser = findUser(currentUser);
        BookingRequest request = findById(requestId);
        boolean isAdmin = currUser.getRole().equals(UserRole.ADMIN);
        User requestOwner = request.getRequester();
        User listingOwner = request.getAccommodationListing().getHost();

        if (!isAdmin && !currUser.getId().equals(listingOwner.getId())
                && !currUser.getId().equals(requestOwner.getId())) {
            throw new RuntimeException("Error: No tienes permiso para editar esta request.");
        }
        
        request.setStatus(requestStatus);
        requestRepository.save(request);

        return new BookingRequestResponseDto(request);
    }

    private BookingRequest findById(UUID requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Error: no se encuentra la solicitud con id:" + requestId));
    }

    private AccommodationListing findListingAssociated(UUID listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException(
                        "Error: no se encuentra el anuncio con id: " + listingId));
    }

    private User findUser(UUID currentUser) {
        return userRepository.findByIdAndDeletedAtIsNull(currentUser)
                .orElseThrow(() -> new RuntimeException("Error: no se encuentra el usuario con id: " + currentUser));
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
            throw new RuntimeException("Error: No tienes permiso para ver esta request.");
        }

        BookingRequestResponseDto response = new BookingRequestResponseDto(request);

        return response;

    }

    @Override
    public Page<BookingRequestResponseDto> getTenantBookingRequests(int page, int size, UUID tenantId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return requestRepository.findByRequesterId(tenantId, pageable)
                .map(BookingRequestResponseDto::new);
    }

    @Override
    public Page<BookingRequestResponseDto> getLandlordBookingRequests(int page, int size, UUID landlordId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return requestRepository.findByAccommodationListingHostId(landlordId, pageable)
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
