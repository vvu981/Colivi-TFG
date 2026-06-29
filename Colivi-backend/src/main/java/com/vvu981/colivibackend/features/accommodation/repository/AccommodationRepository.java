package com.vvu981.colivibackend.features.accommodation.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;

@Repository
public interface AccommodationRepository extends JpaRepository<Accommodation, UUID> {

        Optional<Accommodation> findByIdAndDeletedAtIsNull(UUID id);

        @Query("SELECT a FROM Accommodation a WHERE " +
                        "(:ownerId IS NULL OR a.owner.id = :ownerId) AND (" +
                        "(:visibility = 'ALL') OR " +
                        "(:visibility = 'AVAILABLE' AND a.deletedAt IS NULL) OR " +
                        "(:visibility = 'DELETED' AND a.deletedAt IS NOT NULL))")
        Page<Accommodation> findByFields(
                        @Param("ownerId") UUID ownerId,
                        @Param("visibility") String visibility,
                        Pageable pageable);
}
