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

        List<AccommodationListing> findByAccommodationIdAndDeletedAtIsNull(UUID accommodationId);

        boolean existsByIdAndHostId(UUID listingId, UUID landlordId);

        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.OPTIMISTIC_FORCE_INCREMENT)
        @org.springframework.data.jpa.repository.Query("SELECT a FROM AccommodationListing a WHERE a.id = :id")
        java.util.Optional<AccommodationListing> findByIdWithLock(@org.springframework.data.repository.query.Param("id") UUID id);

        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        @org.springframework.data.jpa.repository.Query("SELECT a FROM AccommodationListing a WHERE a.id = :id")
        java.util.Optional<AccommodationListing> findByIdWithPessimisticLock(@org.springframework.data.repository.query.Param("id") UUID id);
}
