package com.vvu981.colivibackend.features.bookingRequests.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;

public interface BookingRequestRepository
                extends JpaRepository<BookingRequest, UUID>, JpaSpecificationExecutor<BookingRequest> {

        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"requester", "accommodationListing"})
        Page<BookingRequest> findByRequesterId(UUID currentUserId, Pageable page);

        @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(b) FROM BookingRequest b 
            WHERE b.accommodationListing.id = :listingId 
              AND b.status IN ('ACCEPTED', 'CONFIRMED') 
              AND b.startDate <= :endDate 
              AND b.endDate >= :startDate
        """)
        long countOverlappingAcceptedBookings(
            @org.springframework.data.repository.query.Param("listingId") UUID listingId, 
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate, 
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
        );

        @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
        @org.springframework.data.jpa.repository.Query("""
            UPDATE BookingRequest b 
            SET b.status = 'CANCELLED' 
            WHERE b.accommodationListing.id = :listingId 
              AND b.id != :confirmedRequestId
              AND b.status IN ('PENDING', 'ACCEPTED')
              AND b.startDate <= :endDate
              AND b.endDate >= :startDate
        """)
        int cancelOtherRequestsByListingId(
            @org.springframework.data.repository.query.Param("listingId") UUID listingId,
            @org.springframework.data.repository.query.Param("confirmedRequestId") UUID confirmedRequestId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
        );
}
