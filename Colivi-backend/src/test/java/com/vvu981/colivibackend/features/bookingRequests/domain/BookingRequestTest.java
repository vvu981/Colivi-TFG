package com.vvu981.colivibackend.features.bookingRequests.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestResponseDto;
import com.vvu981.colivibackend.features.user.domain.User;

public class BookingRequestTest {

    @Test
    void testConstructorWithDto() {
        UUID listingId = UUID.randomUUID();
        BookingRequestDto dto = new BookingRequestDto(listingId, LocalDate.now().plusDays(10), 6, "Hello world");
        
        User requester = new User();
        requester.setId(UUID.randomUUID());
        
        AccommodationListing listing = new AccommodationListing();
        listing.setId(listingId);

        BookingRequest request = new BookingRequest(dto, requester, listing);

        assertEquals(requester, request.getRequester());
        assertEquals(listing, request.getAccommodationListing());
        assertEquals(dto.startDate(), request.getStartDate());
        assertEquals(dto.durationMonths(), request.getDurationMonths());
        assertEquals(dto.message(), request.getMessage());
        assertEquals(RequestStatus.PENDING, request.getStatus());
    }

    @Test
    void testOnUpdate() {
        BookingRequest request = new BookingRequest();

        assertNull(request.getUpdatedAt());
        request.onUpdate();
        assertNotNull(request.getUpdatedAt());
    }

    @Test
    void testResponseDtoMapping() {
        User requester = new User();
        requester.setId(UUID.randomUUID());

        AccommodationListing listing = new AccommodationListing();
        listing.setId(UUID.randomUUID());

        BookingRequest request = new BookingRequest();
        request.setId(UUID.randomUUID());
        request.setRequester(requester);
        request.setAccommodationListing(listing);
        request.setStartDate(LocalDate.now());
        request.setDurationMonths(12);
        request.setMessage("Test message");
        request.setStatus(RequestStatus.APPROVED);
        request.onUpdate();

        BookingRequestResponseDto responseDto = new BookingRequestResponseDto(request);

        assertEquals(request.getId(), responseDto.id());
        assertEquals(requester.getId(), responseDto.requesterId());
        assertEquals(listing.getId(), responseDto.accommodationListingId());
        assertEquals(request.getStartDate(), responseDto.startDate());
        assertEquals(request.getDurationMonths(), responseDto.durationMonths());
        assertEquals(request.getMessage(), responseDto.message());
        assertEquals(request.getStatus(), responseDto.status());
        assertEquals(request.getCreatedAt(), responseDto.createdAt());
        assertEquals(request.getUpdatedAt(), responseDto.updatedAt());
    }

    @Test
    void testResponseDtoMappingWithNulls() {
        BookingRequest request = new BookingRequest();
        request.setId(UUID.randomUUID());

        BookingRequestResponseDto responseDto = new BookingRequestResponseDto(request);

        assertEquals(request.getId(), responseDto.id());
        assertNull(responseDto.requesterId());
        assertNull(responseDto.accommodationListingId());
        assertNull(responseDto.startDate());
        assertNull(responseDto.durationMonths());
        assertNull(responseDto.message());
        assertEquals(RequestStatus.PENDING, responseDto.status());
        assertNull(responseDto.createdAt());
        assertNull(responseDto.updatedAt());
    }
}
