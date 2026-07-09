package com.vvu981.colivibackend.features.bookingRequests.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestResponseDto;

@Service
public interface BookingRequestService {

    BookingRequestResponseDto createBookingRequest(BookingRequestDto requestDto, UUID currentUser);

    BookingRequestResponseDto updateBookingRequest(BookingRequestDto requestDto, UUID requestId, UUID currentUser);

    BookingRequestResponseDto setStatusBookingRequest(RequestStatus requestStatus, UUID requestId, UUID currentUser);

}
