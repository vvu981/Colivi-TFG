package com.vvu981.colivibackend.features.bookingRequests.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
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

@ExtendWith(MockitoExtension.class)
public class BookingRequestServiceImplTest {

    @Mock
    private BookingRequestRepository requestRepository;
    @Mock
    private AccommodationListingRepository listingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingRequestFilter mockFilter;

    private List<BookingRequestFilter> bookingFilters;

    private BookingRequestServiceImpl bookingRequestService;

    private User requester;
    private User host;
    private User admin;
    private AccommodationListing listing;
    private BookingRequestDto requestDto;
    private BookingRequest bookingRequest;

    @BeforeEach
    void setUp() {
        bookingFilters = List.of(mockFilter);
        bookingRequestService = new BookingRequestServiceImpl(requestRepository, listingRepository, userRepository,
                bookingFilters);

        requester = new User();
        requester.setId(UUID.randomUUID());
        requester.setRole(UserRole.USER);

        host = new User();
        host.setId(UUID.randomUUID());
        host.setRole(UserRole.USER);

        admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setRole(UserRole.ADMIN);

        listing = new AccommodationListing();
        listing.setId(UUID.randomUUID());
        listing.setHost(host);
        listing.setStatus(ListingStatus.AVAILABLE);

        requestDto = new BookingRequestDto(listing.getId(), LocalDate.now().plusDays(5), 3, "Hello");

        bookingRequest = new BookingRequest(requestDto, requester, listing);
        bookingRequest.setId(UUID.randomUUID());
    }

    @Nested
    class CreateBookingRequest {
        @Test
        void success() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
            when(requestRepository.save(any(BookingRequest.class))).thenAnswer(i -> {
                BookingRequest req = i.getArgument(0);
                req.setId(UUID.randomUUID());
                return req;
            });

            BookingRequestResponseDto result = bookingRequestService.createBookingRequest(requestDto,
                    requester.getId());

            assertNotNull(result);
            assertEquals(requestDto.message(), result.message());
            assertEquals(RequestStatus.PENDING, result.status());
            verify(requestRepository).save(any(BookingRequest.class));
        }

        @Test
        void failsIfUserBanned() {
            requester.setBannedAt(LocalDateTime.now());
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));

            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, requester.getId()));
        }

        @Test
        void failsIfListingDeleted() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            listing.setDeletedAt(LocalDateTime.now());
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, requester.getId()));
        }

        @Test
        void failsIfUserNotFound() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.empty());

            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, requester.getId()));
        }

        @Test
        void failsIfUserDeleted() {
            requester.setDeletedAt(LocalDateTime.now());
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, requester.getId()));
        }

        @Test
        void failsIfListingBanned() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            listing.setBannedAt(LocalDateTime.now());
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, requester.getId()));
        }

        @Test
        void failsIfListingNotFound() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.empty());
            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, requester.getId()));
        }

        @Test
        void failsIfListingNotAvailable() {
            listing.setStatus(ListingStatus.BANNED);
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, requester.getId()));
        }

        @Test
        void failsIfUserBooksOwnListing() {
            when(userRepository.findByIdAndDeletedAtIsNull(host.getId())).thenReturn(Optional.of(host));
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.createBookingRequest(requestDto, host.getId()));
        }
    }

    @Nested
    class SetStatusBookingRequest {
        
        @Test
        void successAsHostAccepting() {
            when(userRepository.findByIdAndDeletedAtIsNull(host.getId())).thenReturn(Optional.of(host));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(RequestStatus.ACCEPTED,
                    bookingRequest.getId(), host.getId());

            assertEquals(RequestStatus.ACCEPTED, result.status());
            verify(requestRepository).save(bookingRequest);
        }

        @Test
        void successAsHostRejecting() {
            when(userRepository.findByIdAndDeletedAtIsNull(host.getId())).thenReturn(Optional.of(host));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(RequestStatus.REJECTED,
                    bookingRequest.getId(), host.getId());

            assertEquals(RequestStatus.REJECTED, result.status());
            verify(requestRepository).save(bookingRequest);
        }

        @Test
        void failsIfHostCancels() {
            when(userRepository.findByIdAndDeletedAtIsNull(host.getId())).thenReturn(Optional.of(host));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            assertThrows(ResponseStatusException.class, () -> bookingRequestService
                    .setStatusBookingRequest(RequestStatus.CANCELLED, bookingRequest.getId(), host.getId()));
        }

        @Test
        void successAsRequesterCancelling() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(RequestStatus.CANCELLED,
                    bookingRequest.getId(), requester.getId());

            assertEquals(RequestStatus.CANCELLED, result.status());
        }

        @Test
        void failsIfRequesterAccepts() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            assertThrows(ResponseStatusException.class, () -> bookingRequestService
                    .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(), requester.getId()));
        }

        @Test
        void successAsAdmin() {
            when(userRepository.findByIdAndDeletedAtIsNull(admin.getId())).thenReturn(Optional.of(admin));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(RequestStatus.REJECTED,
                    bookingRequest.getId(), admin.getId());

            assertEquals(RequestStatus.REJECTED, result.status());
        }

        @Test
        void failsIfUnauthorized() {
            User otherUser = new User();
            otherUser.setId(UUID.randomUUID());
            otherUser.setRole(UserRole.USER);

            when(userRepository.findByIdAndDeletedAtIsNull(otherUser.getId())).thenReturn(Optional.of(otherUser));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            assertThrows(ResponseStatusException.class, () -> bookingRequestService
                    .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(), otherUser.getId()));
        }

        @Test
        void failsIfRequestNotFound() {
            when(userRepository.findByIdAndDeletedAtIsNull(host.getId())).thenReturn(Optional.of(host));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.empty());
            assertThrows(ResponseStatusException.class, () -> bookingRequestService
                    .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(), host.getId()));
        }

        @Test
        void failsIfInvalidStateTransition() {
            bookingRequest.setStatus(RequestStatus.ACCEPTED);
            when(userRepository.findByIdAndDeletedAtIsNull(host.getId())).thenReturn(Optional.of(host));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            assertThrows(ResponseStatusException.class, () -> bookingRequestService
                    .setStatusBookingRequest(RequestStatus.REJECTED, bookingRequest.getId(), host.getId()));
        }
    }

    @Nested
    class GetBookingRequestById {
        @Test
        void successForAuthorizedUsers() {
            when(userRepository.findByIdAndDeletedAtIsNull(requester.getId())).thenReturn(Optional.of(requester));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            BookingRequestResponseDto result = bookingRequestService.getBookingRequestById(bookingRequest.getId(),
                    requester.getId());
            assertNotNull(result);
        }

        @Test
        void successAsHost() {
            when(userRepository.findByIdAndDeletedAtIsNull(host.getId())).thenReturn(Optional.of(host));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            BookingRequestResponseDto result = bookingRequestService.getBookingRequestById(bookingRequest.getId(),
                    host.getId());
            assertNotNull(result);
        }

        @Test
        void successAsAdmin() {
            when(userRepository.findByIdAndDeletedAtIsNull(admin.getId())).thenReturn(Optional.of(admin));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            BookingRequestResponseDto result = bookingRequestService.getBookingRequestById(bookingRequest.getId(),
                    admin.getId());
            assertNotNull(result);
        }

        @Test
        void failsForUnauthorized() {
            User otherUser = new User();
            otherUser.setId(UUID.randomUUID());
            otherUser.setRole(UserRole.USER);

            when(userRepository.findByIdAndDeletedAtIsNull(otherUser.getId())).thenReturn(Optional.of(otherUser));
            when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.of(bookingRequest));

            assertThrows(ResponseStatusException.class,
                    () -> bookingRequestService.getBookingRequestById(bookingRequest.getId(), otherUser.getId()));
        }
    }

    @Nested
    class GetLists {
        @Test
        void getTenantRequests() {
            when(requestRepository.findByRequesterId(eq(requester.getId()), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(bookingRequest)));

            Page<BookingRequestResponseDto> res = bookingRequestService.getTenantBookingRequests(0, 10,
                    requester.getId());
            assertEquals(1, res.getTotalElements());
        }

        @Test
        @SuppressWarnings("unchecked")
        void getLandlordRequests() {
            when(requestRepository.findAll(any(Specification.class), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(bookingRequest)));

            Page<BookingRequestResponseDto> res = bookingRequestService.getLandlordBookingRequests(0, 10, host.getId(), listing.getId());
            assertEquals(1, res.getTotalElements());
        }

        @Test
        @SuppressWarnings("unchecked")
        void getAllForAdmin() {
            BookingRequestAdminFilterDto filterDto = new BookingRequestAdminFilterDto(null, null, null, null, null);
            when(mockFilter.isApplicable(filterDto)).thenReturn(true);
            when(mockFilter.buildSpecification(filterDto)).thenReturn(mock(Specification.class));

            when(requestRepository.findAll(any(Specification.class), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(bookingRequest)));

            Page<BookingRequestResponseDto> res = bookingRequestService.getAllBookingRequestsForAdmin(filterDto, 0, 10);
            assertEquals(1, res.getTotalElements());
        }

        @Test
        @SuppressWarnings("unchecked")
        void getAllForAdminWhenFilterNotApplicable() {
            BookingRequestAdminFilterDto filterDto = new BookingRequestAdminFilterDto(null, null, null, null, null);
            when(mockFilter.isApplicable(filterDto)).thenReturn(false);

            when(requestRepository.findAll(any(Specification.class), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(bookingRequest)));

            Page<BookingRequestResponseDto> res = bookingRequestService.getAllBookingRequestsForAdmin(filterDto, 0, 10);
            assertEquals(1, res.getTotalElements());
            verify(mockFilter, never()).buildSpecification(any());
        }
    }
}
