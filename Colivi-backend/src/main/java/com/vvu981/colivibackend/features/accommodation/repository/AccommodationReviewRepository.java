package com.vvu981.colivibackend.features.accommodation.repository;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccommodationReviewRepository extends JpaRepository<AccommodationReview, UUID> {

    @EntityGraph(attributePaths = {"author"})
    Page<AccommodationReview> findByListingIdOrderByCreatedAtDesc(UUID listingId, Pageable pageable);

    boolean existsByBookingRequestId(UUID bookingRequestId);

    boolean existsByAuthorIdAndListingId(UUID authorId, UUID listingId);

    Optional<AccommodationReview> findByBookingRequestId(UUID bookingRequestId);

    @Query("SELECT AVG(r.rating) FROM AccommodationReview r WHERE r.listing.id = :listingId")
    Double getAverageRatingByListingId(@Param("listingId") UUID listingId);

    @Query("SELECT COUNT(r) FROM AccommodationReview r WHERE r.listing.id = :listingId")
    Long countByListingId(@Param("listingId") UUID listingId);

    @Query("SELECT r.rating, COUNT(r) FROM AccommodationReview r WHERE r.listing.id = :listingId GROUP BY r.rating")
    List<Object[]> getRatingBreakdownByListingId(@Param("listingId") UUID listingId);

    @EntityGraph(attributePaths = {"author", "listing", "listing.accommodation"})
    @Query("SELECT r FROM AccommodationReview r WHERE LOWER(r.listing.accommodation.city) = LOWER(:city) ORDER BY r.createdAt DESC")
    List<AccommodationReview> findReviewsByCity(@Param("city") String city);
}
