package com.vvu981.colivibackend.features.accommodation.service.impl;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationReview;
import com.vvu981.colivibackend.features.accommodation.dto.CreateReviewRequest;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewEligibilityResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewSummaryResponse;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationReviewRepository;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationReviewService;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AccommodationReviewServiceImpl implements AccommodationReviewService {

    private final AccommodationReviewRepository reviewRepository;
    private final AccommodationListingRepository listingRepository;
    private final BookingRequestRepository bookingRequestRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(UUID listingId, CreateReviewRequest request, UUID currentUserId) {
        if (currentUserId == null) {
            throw new UnauthorizedActionException("Usuario no autenticado.");
        }

        AccommodationListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Anuncio no encontrado con ID: " + listingId));

        // 1. Validar que el usuario tenga una reserva en estado CONFIRMED para este anuncio
        BookingRequest confirmedBooking = bookingRequestRepository
                .findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                        currentUserId, listingId, RequestStatus.CONFIRMED)
                .orElseThrow(() -> new BusinessRuleValidationException(
                        "Solo los inquilinos con una reserva confirmada pueden emitir una valoración sobre este alojamiento."));

        // 2. Validar que no exista ya una reseña para esta reserva o por este usuario para este anuncio
        if (reviewRepository.existsByBookingRequestId(confirmedBooking.getId())) {
            throw new BusinessRuleValidationException("Ya has emitido una valoración para esta estancia.");
        }

        if (reviewRepository.existsByAuthorIdAndListingId(currentUserId, listingId)) {
            throw new BusinessRuleValidationException("Ya has publicado una valoración para este anuncio.");
        }

        // 3. Crear y persistir la entidad
        AccommodationReview review = AccommodationReview.builder()
                .bookingRequest(confirmedBooking)
                .listing(listing)
                .author(confirmedBooking.getRequester())
                .rating(request.rating())
                .comment(request.comment() != null ? request.comment().trim() : null)
                .build();

        AccommodationReview saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getListingReviews(UUID listingId, Pageable pageable) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Anuncio no encontrado con ID: " + listingId);
        }
        return reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryResponse getListingReviewSummary(UUID listingId) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Anuncio no encontrado con ID: " + listingId);
        }

        Double avg = reviewRepository.getAverageRatingByListingId(listingId);
        Long total = reviewRepository.countByListingId(listingId);
        List<Object[]> breakdown = reviewRepository.getRatingBreakdownByListingId(listingId);

        Map<Integer, Long> breakdownMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            breakdownMap.put(i, 0L);
        }
        if (breakdown != null) {
            for (Object[] row : breakdown) {
                if (row != null && row.length >= 2 && row[0] instanceof Integer rating && row[1] instanceof Long count) {
                    breakdownMap.put(rating, count);
                }
            }
        }

        double formattedAvg = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
        return new ReviewSummaryResponse(formattedAvg, total != null ? total : 0L, breakdownMap);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkEligibility(UUID listingId, UUID currentUserId) {
        if (currentUserId == null) {
            return new ReviewEligibilityResponse(false, null, false, "Inicia sesión para poder valorar.");
        }

        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Anuncio no encontrado con ID: " + listingId);
        }

        if (reviewRepository.existsByAuthorIdAndListingId(currentUserId, listingId)) {
            return new ReviewEligibilityResponse(false, null, true, "Ya has emitido una valoración para este alojamiento.");
        }

        Optional<BookingRequest> confirmedBooking = bookingRequestRepository
                .findFirstByRequesterIdAndAccommodationListingIdAndStatusOrderByCreatedAtDesc(
                        currentUserId, listingId, RequestStatus.CONFIRMED);

        if (confirmedBooking.isEmpty()) {
            return new ReviewEligibilityResponse(false, null, false, "Se requiere una reserva confirmada para poder dejar una valoración.");
        }

        if (reviewRepository.existsByBookingRequestId(confirmedBooking.get().getId())) {
            return new ReviewEligibilityResponse(false, confirmedBooking.get().getId(), true, "Ya has emitido una valoración para esta estancia.");
        }

        return new ReviewEligibilityResponse(true, confirmedBooking.get().getId(), false, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByCity(String city) {
        if (city == null || city.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return reviewRepository.findReviewsByCity(city.trim())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteReview(UUID reviewId, UUID currentUserId, boolean isAdmin) {
        AccommodationReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Valoración no encontrada con ID: " + reviewId));

        if (!isAdmin && (currentUserId == null || !review.getAuthor().getId().equals(currentUserId))) {
            throw new UnauthorizedActionException("No tienes permisos para eliminar esta valoración.");
        }

        reviewRepository.delete(review);
    }

    private ReviewResponse mapToResponse(AccommodationReview review) {
        return new ReviewResponse(
                review.getId(),
                review.getListing() != null ? review.getListing().getId() : null,
                review.getBookingRequest() != null ? review.getBookingRequest().getId() : null,
                review.getAuthor() != null ? review.getAuthor().getId() : null,
                review.getAuthor() != null ? review.getAuthor().getNickname() : null,
                review.getAuthor() != null ? review.getAuthor().getProfilePicUrl() : null,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
