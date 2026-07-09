package com.vvu981.colivibackend.features.bookingRequests.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;

public interface BookingRequestRepository extends JpaRepository<BookingRequest, UUID> {

    Page<BookingRequest> findByDeletedAtIsNull(Pageable pageable);

    Page<BookingRequest> findById(Pageable pageable, UUID id);

}
