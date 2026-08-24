package com.vvu981.colivibackend.features.accommodation.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.user.domain.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AccommodationListingRepository
                extends JpaRepository<AccommodationListing, UUID>, JpaSpecificationExecutor<AccommodationListing> {
        Page<AccommodationListing> findByDeletedAtIsNull(Pageable pageable);

        Page<AccommodationListing> findByHostAndDeletedAtIsNull(User host, Pageable pageable);

        Page<AccommodationListing> findByPricePerMonthBetweenAndDeletedAtIsNull(
                        BigDecimal minPrice,
                        BigDecimal maxPrice,
                        Pageable pageable);

        Page<AccommodationListing> findByStatusAndDeletedAtIsNull(ListingStatus status, Pageable pageable);

        Page<AccommodationListing> findByDeletedAtIsNotNull(Pageable pageable);

        Page<AccommodationListing> findByTitle(String title, Pageable pageable);

        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"images", "images.image", "host", "accommodation"})
        List<AccommodationListing> findByAccommodationIdAndDeletedAtIsNull(UUID accommodationId);

        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"images", "images.image", "host", "accommodation"})
        List<AccommodationListing> findByAccommodationIdAndStatusAndDeletedAtIsNull(UUID accommodationId, ListingStatus status);

        @Override
        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"images", "images.image", "host", "accommodation"})
        java.util.Optional<AccommodationListing> findById(UUID id);

        boolean existsByAccommodationIdAndRentalTypeAndDeletedAtIsNull(UUID accommodationId, com.vvu981.colivibackend.features.accommodation.domain.RentalType rentalType);

        long countByAccommodationIdAndRentalTypeAndDeletedAtIsNull(UUID accommodationId, com.vvu981.colivibackend.features.accommodation.domain.RentalType rentalType);

        @org.springframework.data.jpa.repository.Query("SELECT new com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingStatsDTO(" +
                "COALESCE(SUM(CASE WHEN l.rentalType = 'ENTIRE_PLACE' THEN 1L ELSE 0L END), 0L), " +
                "COALESCE(SUM(CASE WHEN l.rentalType = 'ROOM' THEN 1L ELSE 0L END), 0L)) " +
                "FROM AccommodationListing l WHERE l.accommodation.id = :accommodationId AND l.deletedAt IS NULL AND l.status = 'AVAILABLE'")
        com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingStatsDTO getListingStatsForAccommodation(@org.springframework.data.repository.query.Param("accommodationId") UUID accommodationId);

        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query("UPDATE AccommodationListing l SET l.deletedAt = :time, l.updatedAt = :time, l.version = l.version + 1 WHERE l.accommodation.id = :accId AND l.deletedAt IS NULL")
        void softDeleteAllByAccommodationId(@org.springframework.data.repository.query.Param("accId") UUID accId, @org.springframework.data.repository.query.Param("time") java.time.LocalDateTime time);

        boolean existsByIdAndHostId(UUID listingId, UUID landlordId);

        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.OPTIMISTIC_FORCE_INCREMENT)
        @org.springframework.data.jpa.repository.Query("SELECT a FROM AccommodationListing a WHERE a.id = :id")
        java.util.Optional<AccommodationListing> findByIdWithLock(@org.springframework.data.repository.query.Param("id") UUID id);

        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        @org.springframework.data.jpa.repository.Query("SELECT a FROM AccommodationListing a WHERE a.id = :id")
        java.util.Optional<AccommodationListing> findByIdWithPessimisticLock(@org.springframework.data.repository.query.Param("id") UUID id);

        @Override
        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"host", "accommodation", "accommodation.owner"})
        Page<AccommodationListing> findAll(@org.springframework.lang.Nullable org.springframework.data.jpa.domain.Specification<AccommodationListing> spec, Pageable pageable);
}
