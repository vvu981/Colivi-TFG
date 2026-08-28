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
import com.vvu981.colivibackend.features.bookingRequests.dto.PaymentConfirmationDto;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.bookingRequests.repository.filters.BookingRequestFilter;
import org.springframework.context.ApplicationEventPublisher;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.core.payment.service.PaymentService;

@ExtendWith(MockitoExtension.class)
public class BookingRequestServiceImplTest {

        @Mock
        private BookingRequestRepository requestRepository;
        @Mock
        private AccommodationListingRepository listingRepository;
        @Mock
        private AccommodationRepository accommodationRepository;
        @Mock
        private UserRepository userRepository;
        @Mock
        private ApplicationEventPublisher eventPublisher;
        @Mock
        private BookingRequestFilter mockFilter;
        @Mock
        private BookingRequestValidator bookingRequestValidator;
        @Mock
        private PaymentService paymentService;
        @Mock
        private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

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
                bookingRequestService = new BookingRequestServiceImpl(requestRepository, listingRepository,
                                userRepository,
                                accommodationRepository, eventPublisher, paymentService, transactionTemplate, bookingRequestValidator,
                                bookingFilters);

                requester = new User();
                requester.setId(UUID.randomUUID());
                requester.setRole(UserRole.USER);
                requester.setEmail("tenant@example.com");

                host = new User();
                host.setId(UUID.randomUUID());
                host.setRole(UserRole.USER);

                admin = new User();
                admin.setId(UUID.randomUUID());
                admin.setRole(UserRole.ADMIN);

                Accommodation acc = new Accommodation();
                acc.setId(UUID.randomUUID());

                listing = new AccommodationListing();
                listing.setId(UUID.randomUUID());
                listing.setHost(host);
                listing.setPricePerMonth(java.math.BigDecimal.valueOf(500));
                listing.setSecurityDeposit(java.math.BigDecimal.valueOf(100));
                listing.setStatus(ListingStatus.AVAILABLE);
                listing.setTitle("Nice Apartment");
                listing.setAccommodation(acc);

                requestDto = new BookingRequestDto(listing.getId(), LocalDate.now().plusDays(5),
                                LocalDate.now().plusMonths(3),
                                "Hello");

                bookingRequest = new BookingRequest(requestDto, requester, listing);
                bookingRequest.setId(UUID.randomUUID());
        }

        @Nested
        class CreateBookingRequest {
                @Test
                void success() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
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
                        verify(eventPublisher).publishEvent(any(com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent.class));
                }

                @Test
                void failsIfUserBanned() {
                        requester.setBannedAt(LocalDateTime.now());
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));

                        assertThrows(UnauthorizedActionException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto,
                                                        requester.getId()));
                }

                @Test
                void failsIfListingDeleted() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        listing.setDeletedAt(LocalDateTime.now());
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto,
                                                        requester.getId()));
                }

                @Test
                void failsIfUserNotFound() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.empty());

                        assertThrows(ResourceNotFoundException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto,
                                                        requester.getId()));
                }

                @Test
                void failsIfUserDeleted() {
                        requester.setDeletedAt(LocalDateTime.now());
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        assertThrows(UnauthorizedActionException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto,
                                                        requester.getId()));
                }

                @Test
                void failsIfListingBanned() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        listing.setBannedAt(LocalDateTime.now());
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto,
                                                        requester.getId()));
                }

                @Test
                void failsIfListingNotFound() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.empty());
                        assertThrows(ResourceNotFoundException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto,
                                                        requester.getId()));
                }

                @Test
                void failsIfListingNotAvailable() {
                        listing.setStatus(ListingStatus.BANNED);
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto,
                                                        requester.getId()));
                }

                @Test
                void failsIfUserBooksOwnListing() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.createBookingRequest(requestDto, host.getId()));
                }
        }

        @Nested
        class SetStatusBookingRequest {

                @Test
                void successAsHostAccepting() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(listingRepository.findByIdWithPessimisticLock(listing.getId()))
                                        .thenReturn(Optional.of(listing));

                        BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(
                                        RequestStatus.ACCEPTED,
                                        bookingRequest.getId(), host.getId());

                        assertEquals(RequestStatus.ACCEPTED, result.status());
                        verify(requestRepository).save(bookingRequest);
                        verify(eventPublisher).publishEvent(any(BookingStatusChangedEvent.class));
                }

                @Test
                void successAsHostRejecting() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(
                                        RequestStatus.REJECTED,
                                        bookingRequest.getId(), host.getId());

                        assertEquals(RequestStatus.REJECTED, result.status());
                        verify(requestRepository).save(bookingRequest);
                        verify(eventPublisher).publishEvent(any(BookingStatusChangedEvent.class));
                }

                @Test
                void failsIfHostAcceptsButAccommodationIsFull() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(listingRepository.findByIdWithPessimisticLock(listing.getId()))
                                        .thenReturn(Optional.of(listing));

                        doThrow(new BusinessRuleValidationException(
                                        "El alojamiento ya está completo para las fechas seleccionadas."))
                                        .when(bookingRequestValidator)
                                        .validateBookingDates(bookingRequest.getStartDate(),
                                                        bookingRequest.getEndDate(),
                                                        bookingRequest.getAccommodationListing());

                        assertThrows(BusinessRuleValidationException.class, () -> bookingRequestService
                                        .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(),
                                                        host.getId()));
                }

                @Test
                void failsIfHostCancels() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        assertThrows(UnauthorizedActionException.class, () -> bookingRequestService
                                        .setStatusBookingRequest(RequestStatus.CANCELLED, bookingRequest.getId(),
                                                        host.getId()));
                }

                @Test
                void successAsRequesterCancelling() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(
                                        RequestStatus.CANCELLED,
                                        bookingRequest.getId(), requester.getId());

                        assertEquals(RequestStatus.CANCELLED, result.status());
                }

                @Test
                void successAsRequesterCancellingWhenAccepted() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(
                                        RequestStatus.CANCELLED,
                                        bookingRequest.getId(), requester.getId());

                        assertEquals(RequestStatus.CANCELLED, result.status());
                }

                @Test
                void failsIfRequesterAccepts() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(listingRepository.findByIdWithPessimisticLock(listing.getId()))
                                        .thenReturn(Optional.of(listing));

                        assertThrows(UnauthorizedActionException.class, () -> bookingRequestService
                                        .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(),
                                                        requester.getId()));
                }

                @Test
                void successAsAdmin() {
                        when(userRepository.findActiveById(admin.getId())).thenReturn(Optional.of(admin));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        BookingRequestResponseDto result = bookingRequestService.setStatusBookingRequest(
                                        RequestStatus.REJECTED,
                                        bookingRequest.getId(), admin.getId());

                        assertEquals(RequestStatus.REJECTED, result.status());
                }

                @Test
                void failsIfUnauthorized() {
                        User otherUser = new User();
                        otherUser.setId(UUID.randomUUID());
                        otherUser.setRole(UserRole.USER);

                        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(listingRepository.findByIdWithPessimisticLock(listing.getId()))
                                        .thenReturn(Optional.of(listing));

                        assertThrows(UnauthorizedActionException.class, () -> bookingRequestService
                                        .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(),
                                                        otherUser.getId()));
                }

                @Test
                void failsIfRequestNotFound() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId())).thenReturn(Optional.empty());
                        assertThrows(ResourceNotFoundException.class, () -> bookingRequestService
                                        .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(),
                                                        host.getId()));
                }

                @Test
                void failsIfInvalidStateTransition() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        assertThrows(BusinessRuleValidationException.class, () -> bookingRequestService
                                        .setStatusBookingRequest(RequestStatus.REJECTED, bookingRequest.getId(),
                                                        host.getId()));
                }

                @Test
                void failsIfHostAcceptsButListingNotFoundForLock() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(listingRepository.findByIdWithPessimisticLock(listing.getId()))
                                        .thenReturn(Optional.empty());

                        assertThrows(ResourceNotFoundException.class, () -> bookingRequestService
                                        .setStatusBookingRequest(RequestStatus.ACCEPTED, bookingRequest.getId(),
                                                        host.getId()));
                }
        }

        @Nested
        class GetBookingRequestById {
                @Test
                void successForAuthorizedUsers() {
                        when(userRepository.findActiveById(requester.getId())).thenReturn(Optional.of(requester));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        BookingRequestResponseDto result = bookingRequestService.getBookingRequestById(
                                        bookingRequest.getId(),
                                        requester.getId());
                        assertNotNull(result);
                }

                @Test
                void successAsHost() {
                        when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        BookingRequestResponseDto result = bookingRequestService.getBookingRequestById(
                                        bookingRequest.getId(),
                                        host.getId());
                        assertNotNull(result);
                }

                @Test
                void successAsAdmin() {
                        when(userRepository.findActiveById(admin.getId())).thenReturn(Optional.of(admin));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        BookingRequestResponseDto result = bookingRequestService.getBookingRequestById(
                                        bookingRequest.getId(),
                                        admin.getId());
                        assertNotNull(result);
                }

                @Test
                void failsForUnauthorized() {
                        User otherUser = new User();
                        otherUser.setId(UUID.randomUUID());
                        otherUser.setRole(UserRole.USER);

                        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        assertThrows(UnauthorizedActionException.class,
                                        () -> bookingRequestService.getBookingRequestById(bookingRequest.getId(),
                                                        otherUser.getId()));
                }
        }

        @Nested
        class GetLists {
                @Test
                void getTenantRequests() {
                        when(requestRepository.findByRequesterIdAndStatusNot(eq(requester.getId()), eq(RequestStatus.CANCELLED), any(PageRequest.class)))
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

                        Page<BookingRequestResponseDto> res = bookingRequestService.getLandlordBookingRequests(0, 10,
                                        host.getId(),
                                        listing.getId());
                        assertEquals(1, res.getTotalElements());
                }

                @Test
                @SuppressWarnings("unchecked")
                void getAllForAdmin() {
                        BookingRequestAdminFilterDto filterDto = new BookingRequestAdminFilterDto(null, null, null,
                                        null, null);
                        when(mockFilter.isApplicable(filterDto)).thenReturn(true);
                        when(mockFilter.buildSpecification(filterDto)).thenReturn(mock(Specification.class));

                        when(requestRepository.findAll(any(Specification.class), any(PageRequest.class)))
                                        .thenReturn(new PageImpl<>(List.of(bookingRequest)));

                        Page<BookingRequestResponseDto> res = bookingRequestService
                                        .getAllBookingRequestsForAdmin(filterDto, 0, 10);
                        assertEquals(1, res.getTotalElements());
                }

                @Test
                @SuppressWarnings("unchecked")
                void getAllForAdminWhenFilterNotApplicable() {
                        BookingRequestAdminFilterDto filterDto = new BookingRequestAdminFilterDto(null, null, null,
                                        null, null);
                        when(mockFilter.isApplicable(filterDto)).thenReturn(false);

                        when(requestRepository.findAll(any(Specification.class), any(PageRequest.class)))
                                        .thenReturn(new PageImpl<>(List.of(bookingRequest)));

                        Page<BookingRequestResponseDto> res = bookingRequestService
                                        .getAllBookingRequestsForAdmin(filterDto, 0, 10);
                        assertEquals(1, res.getTotalElements());
                        verify(mockFilter, never()).buildSpecification(any());
                }
        }

        @Nested
        class ConfirmBookingPayment {
                @BeforeEach
                void setUpTransactionTemplate() {
                        lenient().when(transactionTemplate.execute(any())).thenAnswer(i -> {
                                org.springframework.transaction.support.TransactionCallback<?> callback = i.getArgument(0);
                                return callback.doInTransaction(new org.springframework.transaction.support.SimpleTransactionStatus());
                        });
                }

                @Test
                void success() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(listingRepository.findByIdWithPessimisticLock(any(UUID.class)))
                                        .thenReturn(Optional.of(listing));
                        when(requestRepository.save(any(BookingRequest.class))).thenReturn(bookingRequest);
                        when(paymentService.processPayment(anyString(), any())).thenReturn("TXN-12345");

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto(
                                        "tok_12345", "Credit Card");

                        BookingRequestResponseDto result = bookingRequestService.confirmBookingPayment(
                                        bookingRequest.getId(),
                                        paymentDto, requester.getId());

                        assertNotNull(result);
                        assertEquals(RequestStatus.CONFIRMED, result.status());
                        assertEquals(ListingStatus.UNAVAILABLE, listing.getStatus());
                        verify(requestRepository).save(bookingRequest);
                        verify(listingRepository).save(listing);
                }

                @Test
                void failsIfNotRequester() {
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto(
                                        "tok_12345", "Credit Card");

                        assertThrows(UnauthorizedActionException.class,
                                        () -> bookingRequestService.confirmBookingPayment(bookingRequest.getId(),
                                                        paymentDto,
                                                        host.getId()));
                }

                @Test
                void failsAndRefundsIfListingBecomesUnavailable() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        // El anuncio empieza disponible para que pase la primera transacción
                        listing.setStatus(ListingStatus.AVAILABLE);

                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        
                        when(listingRepository.findByIdWithPessimisticLock(any(UUID.class)))
                                        .thenReturn(Optional.of(listing));
                        
                        // Simulamos concurrencia: justo durante el pago, el anuncio deja de estar disponible
                        when(paymentService.processPayment(anyString(), any())).thenAnswer(i -> {
                                listing.setStatus(ListingStatus.UNAVAILABLE);
                                return "TXN-12345";
                        });

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto(
                                        "tok_12345", "Credit Card");

                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.confirmBookingPayment(bookingRequest.getId(),
                                                        paymentDto, requester.getId()));

                        verify(paymentService).refund("TXN-12345");
                }

                @Test
                void failsIfRequestNotAccepted() {
                        bookingRequest.setStatus(RequestStatus.PENDING);
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto("tok_123", "CC");

                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.confirmBookingPayment(bookingRequest.getId(),
                                                        paymentDto, requester.getId()));
                }

                @Test
                void failsIfListingNotAvailableInFirstTransaction() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        listing.setStatus(ListingStatus.UNAVAILABLE);
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto("tok_123", "CC");

                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.confirmBookingPayment(bookingRequest.getId(),
                                                        paymentDto, requester.getId()));
                }

                @Test
                void failsIfPaymentServiceThrows() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(paymentService.processPayment(anyString(), any())).thenThrow(new RuntimeException("Payment Error"));

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto("tok_123", "CC");

                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.confirmBookingPayment(bookingRequest.getId(),
                                                        paymentDto, requester.getId()));
                }

                @Test
                void failsAndRefundsIfListingNotFoundInSecondTransaction() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        when(requestRepository.findById(bookingRequest.getId()))
                                        .thenReturn(Optional.of(bookingRequest));
                        when(listingRepository.findByIdWithPessimisticLock(any(UUID.class)))
                                        .thenReturn(Optional.empty());
                        when(paymentService.processPayment(anyString(), any())).thenReturn("TXN-123");

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto("tok_123", "CC");

                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.confirmBookingPayment(bookingRequest.getId(),
                                                        paymentDto, requester.getId()));
                        verify(paymentService).refund("TXN-123");
                }

                @Test
                void failsAndRefundsIfRequestConfirmThrowsIllegalState() {
                        bookingRequest.setStatus(RequestStatus.ACCEPTED);
                        listing.setStatus(ListingStatus.AVAILABLE);

                        BookingRequest mockRequest = spy(bookingRequest);
                        when(requestRepository.findById(mockRequest.getId()))
                                        .thenReturn(Optional.of(mockRequest));
                        when(listingRepository.findByIdWithPessimisticLock(any(UUID.class)))
                                        .thenReturn(Optional.of(listing));
                        when(paymentService.processPayment(anyString(), any())).thenReturn("TXN-123");

                        doThrow(new IllegalStateException("Estado inválido para confirmar")).when(mockRequest).confirm(anyString(), anyString());

                        PaymentConfirmationDto paymentDto = new PaymentConfirmationDto("tok_123", "CC");

                        assertThrows(BusinessRuleValidationException.class,
                                        () -> bookingRequestService.confirmBookingPayment(mockRequest.getId(),
                                                        paymentDto, requester.getId()));
                        verify(paymentService).refund("TXN-123");
                }
        }

        @Nested
        class CountPendingRequestsForLandlord {
                @Test
                void returnsCountFromRepository() {
                        UUID landlordId = UUID.randomUUID();
                        when(requestRepository.countPendingRequestsByHostId(landlordId)).thenReturn(3L);

                        long count = bookingRequestService.countPendingRequestsForLandlord(landlordId);

                        assertEquals(3L, count);
                        verify(requestRepository).countPendingRequestsByHostId(landlordId);
                }
        }
}
