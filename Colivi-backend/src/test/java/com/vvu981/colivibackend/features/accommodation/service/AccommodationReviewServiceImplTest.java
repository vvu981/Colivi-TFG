package com.vvu981.colivibackend.features.accommodation.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationReview;
import com.vvu981.colivibackend.features.accommodation.dto.CreateReviewRequest;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewEligibilityResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewSummaryResponse;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationReviewRepository;
import com.vvu981.colivibackend.features.accommodation.service.impl.AccommodationReviewServiceImpl;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccommodationReviewServiceImpl Test Suite")
class AccommodationReviewServiceImplTest {

    @Mock
    private AccommodationReviewRepository reviewRepository;

    @Mock
    private AccommodationListingRepository listingRepository;

    @Mock
    private BookingRequestRepository bookingRequestRepository;

    @InjectMocks
    private AccommodationReviewServiceImpl reviewService;

    private UUID userId;
    private UUID listingId;
    private UUID bookingId;
    private UUID reviewId;
    private User author;
    private AccommodationListing listing;
    private BookingRequest confirmedBooking;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        listingId = UUID.randomUUID();
        bookingId = UUID.randomUUID();
        reviewId = UUID.randomUUID();

        author = new User();
        author.setId(userId);
        author.setNickname("tenant_user");
        author.setProfilePicUrl("https://example.com/pic.jpg");

        Accommodation accommodation = new Accommodation();
        accommodation.setId(UUID.randomUUID());
        accommodation.setCity("Valencia");

        listing = new AccommodationListing();
        listing.setId(listingId);
        listing.setAccommodation(accommodation);

        confirmedBooking = BookingRequest.builder()
                .id(bookingId)
                .requester(author)
                .accommodationListing(listing)
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(2))
                .status(RequestStatus.CONFIRMED)
                .build();
    }

    @Nested
    @DisplayName("Create Review Tests")
    class CreateReviewTests {

        @Test
        @DisplayName("Should successfully create review when user has confirmed booking")
        void createReview_success() {
            CreateReviewRequest request = new CreateReviewRequest(5, "Piso excelente y muy luminoso.");

            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(bookingRequestRepository.findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                    userId, listingId, RequestStatus.CONFIRMED)).thenReturn(Optional.of(confirmedBooking));
            when(reviewRepository.existsByBookingRequestId(bookingId)).thenReturn(false);
            when(reviewRepository.existsByAuthorIdAndListingId(userId, listingId)).thenReturn(false);

            AccommodationReview saved = AccommodationReview.builder()
                    .id(reviewId)
                    .bookingRequest(confirmedBooking)
                    .listing(listing)
                    .author(author)
                    .rating(5)
                    .comment("Piso excelente y muy luminoso.")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(reviewRepository.save(any(AccommodationReview.class))).thenReturn(saved);

            ReviewResponse response = reviewService.createReview(listingId, request, userId);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(reviewId);
            assertThat(response.rating()).isEqualTo(5);
            assertThat(response.comment()).isEqualTo("Piso excelente y muy luminoso.");
            assertThat(response.authorNickname()).isEqualTo("tenant_user");

            verify(reviewRepository).save(any(AccommodationReview.class));
        }

        @Test
        @DisplayName("Should throw UnauthorizedActionException when user is null")
        void createReview_unauthenticated() {
            CreateReviewRequest request = new CreateReviewRequest(5, "Comentario");

            assertThatThrownBy(() -> reviewService.createReview(listingId, request, null))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("Usuario no autenticado");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when listing does not exist")
        void createReview_listingNotFound() {
            CreateReviewRequest request = new CreateReviewRequest(5, "Comentario");
            when(listingRepository.findById(listingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.createReview(listingId, request, userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Anuncio no encontrado");
        }

        @Test
        @DisplayName("Should throw BusinessRuleValidationException when user has no confirmed booking")
        void createReview_noConfirmedBooking() {
            CreateReviewRequest request = new CreateReviewRequest(5, "Comentario");
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(bookingRequestRepository.findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                    userId, listingId, RequestStatus.CONFIRMED)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.createReview(listingId, request, userId))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("Solo los inquilinos con una reserva confirmada");
        }

        @Test
        @DisplayName("Should throw BusinessRuleValidationException when booking starts in the future")
        void createReview_futureBooking() {
            CreateReviewRequest request = new CreateReviewRequest(5, "Comentario");
            BookingRequest futureBooking = BookingRequest.builder()
                    .id(bookingId)
                    .requester(author)
                    .accommodationListing(listing)
                    .startDate(LocalDate.now().plusMonths(1))
                    .endDate(LocalDate.now().plusMonths(3))
                    .status(RequestStatus.CONFIRMED)
                    .build();

            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(bookingRequestRepository.findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                    userId, listingId, RequestStatus.CONFIRMED)).thenReturn(Optional.of(futureBooking));

            assertThatThrownBy(() -> reviewService.createReview(listingId, request, userId))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("No puedes valorar un alojamiento antes del inicio de tu estancia.");
        }

        @Test
        @DisplayName("Should throw BusinessRuleValidationException when review already exists for booking")
        void createReview_alreadyReviewedBooking() {
            CreateReviewRequest request = new CreateReviewRequest(5, "Comentario");
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(bookingRequestRepository.findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                    userId, listingId, RequestStatus.CONFIRMED)).thenReturn(Optional.of(confirmedBooking));
            when(reviewRepository.existsByBookingRequestId(bookingId)).thenReturn(true);

            assertThatThrownBy(() -> reviewService.createReview(listingId, request, userId))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("Ya has emitido una valoración para esta estancia");
        }

        @Test
        @DisplayName("Should throw BusinessRuleValidationException when review already exists for author and listing")
        void createReview_alreadyReviewedListing() {
            CreateReviewRequest request = new CreateReviewRequest(5, "Comentario");
            when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
            when(bookingRequestRepository.findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                    userId, listingId, RequestStatus.CONFIRMED)).thenReturn(Optional.of(confirmedBooking));
            when(reviewRepository.existsByBookingRequestId(bookingId)).thenReturn(false);
            when(reviewRepository.existsByAuthorIdAndListingId(userId, listingId)).thenReturn(true);

            assertThatThrownBy(() -> reviewService.createReview(listingId, request, userId))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("Ya has publicado una valoración para este anuncio");
        }
    }

    @Nested
    @DisplayName("Get Listing Reviews & Summary Tests")
    class GetReviewsTests {

        @Test
        @DisplayName("Should return paginated reviews for listing")
        void getListingReviews_success() {
            Pageable pageable = PageRequest.of(0, 10);
            AccommodationReview review = AccommodationReview.builder()
                    .id(reviewId)
                    .bookingRequest(confirmedBooking)
                    .listing(listing)
                    .author(author)
                    .rating(4)
                    .comment("Muy buena experiencia")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(listingRepository.existsById(listingId)).thenReturn(true);
            when(reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId, pageable))
                    .thenReturn(new PageImpl<>(List.of(review), pageable, 1));

            Page<ReviewResponse> result = reviewService.getListingReviews(listingId, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).rating()).isEqualTo(4);
        }

        @Test
        @DisplayName("Should return summary rating with breakdown")
        void getListingReviewSummary_success() {
            when(listingRepository.existsById(listingId)).thenReturn(true);
            when(reviewRepository.getAverageRatingByListingId(listingId)).thenReturn(4.666);
            when(reviewRepository.countByListingId(listingId)).thenReturn(3L);
            when(reviewRepository.getRatingBreakdownByListingId(listingId)).thenReturn(List.<Object[]>of(
                    new Object[]{5, 2L},
                    new Object[]{4, 1L}
            ));

            ReviewSummaryResponse summary = reviewService.getListingReviewSummary(listingId);

            assertThat(summary).isNotNull();
            assertThat(summary.averageRating()).isEqualTo(4.7);
            assertThat(summary.totalReviews()).isEqualTo(3L);
            assertThat(summary.ratingBreakdown().get(5)).isEqualTo(2L);
            assertThat(summary.ratingBreakdown().get(4)).isEqualTo(1L);
            assertThat(summary.ratingBreakdown().get(1)).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("Check Eligibility Tests")
    class EligibilityTests {

        @Test
        @DisplayName("Should return eligible true when user has confirmed booking and no previous review")
        void checkEligibility_eligible() {
            when(listingRepository.existsById(listingId)).thenReturn(true);
            when(reviewRepository.existsByAuthorIdAndListingId(userId, listingId)).thenReturn(false);
            when(bookingRequestRepository.findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                    userId, listingId, RequestStatus.CONFIRMED)).thenReturn(Optional.of(confirmedBooking));
            when(reviewRepository.existsByBookingRequestId(bookingId)).thenReturn(false);

            ReviewEligibilityResponse response = reviewService.checkEligibility(listingId, userId);

            assertThat(response.eligible()).isTrue();
            assertThat(response.eligibleBookingRequestId()).isEqualTo(bookingId);
            assertThat(response.alreadyReviewed()).isFalse();
        }

        @Test
        @DisplayName("Should return eligible false when confirmed booking is in the future")
        void checkEligibility_futureBooking() {
            BookingRequest futureBooking = BookingRequest.builder()
                    .id(bookingId)
                    .requester(author)
                    .accommodationListing(listing)
                    .startDate(LocalDate.now().plusMonths(1))
                    .endDate(LocalDate.now().plusMonths(3))
                    .status(RequestStatus.CONFIRMED)
                    .build();

            when(listingRepository.existsById(listingId)).thenReturn(true);
            when(reviewRepository.existsByAuthorIdAndListingId(userId, listingId)).thenReturn(false);
            when(bookingRequestRepository.findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                    userId, listingId, RequestStatus.CONFIRMED)).thenReturn(Optional.of(futureBooking));

            ReviewEligibilityResponse response = reviewService.checkEligibility(listingId, userId);

            assertThat(response.eligible()).isFalse();
            assertThat(response.eligibleBookingRequestId()).isEqualTo(bookingId);
            assertThat(response.alreadyReviewed()).isFalse();
            assertThat(response.reason()).contains("comenzado tu estancia");
        }

        @Test
        @DisplayName("Should return eligible false when user is not logged in")
        void checkEligibility_notLoggedIn() {
            ReviewEligibilityResponse response = reviewService.checkEligibility(listingId, null);

            assertThat(response.eligible()).isFalse();
            assertThat(response.reason()).contains("Inicia sesión");
        }

        @Test
        @DisplayName("Should return alreadyReviewed true when user already reviewed listing")
        void checkEligibility_alreadyReviewedListing() {
            when(listingRepository.existsById(listingId)).thenReturn(true);
            when(reviewRepository.existsByAuthorIdAndListingId(userId, listingId)).thenReturn(true);

            ReviewEligibilityResponse response = reviewService.checkEligibility(listingId, userId);

            assertThat(response.eligible()).isFalse();
            assertThat(response.alreadyReviewed()).isTrue();
        }
    }

    @Nested
    @DisplayName("City Reviews & Delete Tests")
    class CityAndDeleteTests {

        @Test
        @DisplayName("Should return reviews by city for MCP Server")
        void getReviewsByCity_success() {
            AccommodationReview review = AccommodationReview.builder()
                    .id(reviewId)
                    .bookingRequest(confirmedBooking)
                    .listing(listing)
                    .author(author)
                    .rating(5)
                    .comment("Gran ubicación")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(reviewRepository.findReviewsByCity("Valencia")).thenReturn(List.of(review));

            List<ReviewResponse> result = reviewService.getReviewsByCity("Valencia");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).comment()).isEqualTo("Gran ubicación");
        }

        @Test
        @DisplayName("Should allow author to delete own review")
        void deleteReview_asAuthor_success() {
            AccommodationReview review = AccommodationReview.builder()
                    .id(reviewId)
                    .author(author)
                    .build();

            when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

            reviewService.deleteReview(reviewId, userId, false);

            verify(reviewRepository).delete(review);
        }

        @Test
        @DisplayName("Should allow admin to delete any review")
        void deleteReview_asAdmin_success() {
            UUID otherUserId = UUID.randomUUID();
            AccommodationReview review = AccommodationReview.builder()
                    .id(reviewId)
                    .author(author)
                    .build();

            when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

            reviewService.deleteReview(reviewId, otherUserId, true);

            verify(reviewRepository).delete(review);
        }

        @Test
        @DisplayName("Should throw UnauthorizedActionException when non-admin tries to delete other review")
        void deleteReview_unauthorized() {
            UUID otherUserId = UUID.randomUUID();
            AccommodationReview review = AccommodationReview.builder()
                    .id(reviewId)
                    .author(author)
                    .build();

            when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

            assertThatThrownBy(() -> reviewService.deleteReview(reviewId, otherUserId, false))
                    .isInstanceOf(UnauthorizedActionException.class);

            verify(reviewRepository, never()).delete(any());
        }
    }
}
