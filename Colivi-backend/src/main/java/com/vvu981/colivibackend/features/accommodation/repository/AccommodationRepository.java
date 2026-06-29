package com.vvu981.colivibackend.features.accommodation.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.user.domain.User;

public interface AccommodationRepository extends JpaRepository<Accommodation, UUID> {

    Optional<Accommodation> findByIdAndDeletedAtIsNull(UUID id);

    Page<Accommodation> findByOwnerAndDeletedAtIsNull(User owner, Pageable pageable);

    Page<Accommodation> findByDeletedAtIsNull(Pageable pageable);

    Page<Accommodation> findByDeletedAtIsNotNull(Pageable pageable);
}
