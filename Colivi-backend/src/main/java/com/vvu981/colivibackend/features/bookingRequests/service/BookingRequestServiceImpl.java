package com.vvu981.colivibackend.features.bookingRequests.service;

import java.time.LocalDateTime;
import java.util.UUID;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestResponseDto;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class BookingRequestServiceImpl implements BookingRequestService {

    private final BookingRequestRepository requestRepository;
    private final AccommodationListingRepository listingRepository;
    private final UserRepository userRepository;

    @Override
    public BookingRequestResponseDto createBookingRequest(BookingRequestDto requestDto, UUID currentUser) {
        User currUser = findUser(currentUser);

        if (currUser.isBanned() || (currUser.getDeletedAt() != null))
            throw new RuntimeException("Error: estas baneado o eliminado.");

        AccommodationListing listing = findListingAssociated(requestDto.accommodationListingId());
        if (listing.getBannedAt() != null || listing.getDeletedAt() != null)
            throw new RuntimeException("Error: el listing esta eliminado o baneado.");
        BookingRequest requestToCreate = new BookingRequest(requestDto);

        requestRepository.save(requestToCreate);

        return new BookingRequestResponseDto(requestToCreate);
    }

    @Override
    public BookingRequestResponseDto updateBookingRequest(BookingRequestDto requestDto, UUID requestId,
            UUID currentUser) {

        User currUser = findUser(currentUser);
        BookingRequest bookingRequest = findById(requestId);
        if (!canEdit(currUser, bookingRequest))
            throw new RuntimeException("Error: no puedes editar esta solicitud.");

        bookingRequest.setMessage(requestDto.message());
        bookingRequest.setUpdatedAt(LocalDateTime.now());

        return new BookingRequestResponseDto(bookingRequest);
    }

    @Override
    public BookingRequestResponseDto setStatusBookingRequest(RequestStatus requestStatus, UUID requestId,
            UUID currentUser) {
        throw new UnsupportedOperationException("Unimplemented method 'setStatusBookingRequest'");
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

    private boolean canEdit(User currentUser, BookingRequest bookingRequest) {
        boolean isRequestOwner = currentUser.equals(bookingRequest.getRequester());
        boolean isAdmin = currentUser.getRole().equals(UserRole.ADMIN);

        return isRequestOwner || isAdmin;
    }

    private User findUser(UUID currentUser) {
        return userRepository.findByIdAndDeletedAtIsNull(currentUser)
                .orElseThrow(() -> new RuntimeException("Error: no se encuentra el usuario con id: " + currentUser));
    }

}
