package com.vvu981.colivibackend.features.bookingRequests.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;

public interface BookingRequestRepository
        extends JpaRepository<BookingRequest, UUID>, JpaSpecificationExecutor<BookingRequest> {

    Page<BookingRequest> findByRequesterId(UUID currentUserId, Pageable page);

    Page<BookingRequest> findByAccommodationListingHostId(UUID currentUserId, Pageable page);

    @Query("SELECT b FROM BookingRequest b WHERE " +
            "(:listingId IS NULL OR b.accommodationListing.id = :listingId) AND " +
            "(:requesterId IS NULL OR b.requester.id = :requesterId) AND " +
            "(:status IS NULL OR b.status = :status)")
    Page<BookingRequest> findAllAdminFiltered(
            @Param("listingId") UUID listingId,
            @Param("requesterId") UUID requesterId,
            @Param("status") RequestStatus status,
            Pageable pageable);
}
