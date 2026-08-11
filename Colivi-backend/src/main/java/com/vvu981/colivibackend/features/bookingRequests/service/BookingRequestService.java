package com.vvu981.colivibackend.features.bookingRequests.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestResponseDto;

@Service
public interface BookingRequestService {

    BookingRequestResponseDto createBookingRequest(BookingRequestDto requestDto, UUID currentUser);

    BookingRequestResponseDto setStatusBookingRequest(RequestStatus requestStatus, UUID requestId, UUID currentUser);

    BookingRequestResponseDto confirmBookingPayment(UUID requestId, com.vvu981.colivibackend.features.bookingRequests.dto.PaymentConfirmationDto paymentDto, UUID currentUserId);

    BookingRequestResponseDto getBookingRequestById(UUID requestId, UUID currentUser);

    Page<BookingRequestResponseDto> getTenantBookingRequests(int page, int size, UUID currentUserId); // inquilino o
                                                                                                      // arrendatario

    Page<BookingRequestResponseDto> getLandlordBookingRequests(int page, int size, UUID landlordId, UUID listingId); // arrendador

    Page<BookingRequestResponseDto> getAllBookingRequestsForAdmin(BookingRequestAdminFilterDto filter, int page,
            int size);

}
