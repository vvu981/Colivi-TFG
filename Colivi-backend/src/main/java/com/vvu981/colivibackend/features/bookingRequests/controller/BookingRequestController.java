package com.vvu981.colivibackend.features.bookingRequests.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestResponseDto;
import com.vvu981.colivibackend.features.bookingRequests.service.BookingRequestService;

@RestController
@RequestMapping("/api/v1/booking-requests")
public class BookingRequestController {

    private final BookingRequestService requestService;

    public BookingRequestController(BookingRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    public ResponseEntity<BookingRequestResponseDto> createBookingRequest(
            @RequestBody BookingRequestDto requestDto,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        // El dueño de la reserva es el propio usuario logueado
        BookingRequestResponseDto response = requestService.createBookingRequest(requestDto, currentUserId);
        // Usamos HttpStatus.CREATED (201) para cumplir con el estándar REST
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/admin/{tenantId}")
    @PreAuthorize("hasAuthority('ADMIN')") // Solo los administradores pueden tocar este endpoint
    public ResponseEntity<BookingRequestResponseDto> createBookingRequestByAdmin(
            @RequestBody BookingRequestDto requestDto,
            @PathVariable("tenantId") UUID tenantId // Capturamos el ID del inquilino objetivo desde la URL
    ) {
        BookingRequestResponseDto response = requestService.createBookingRequest(requestDto, tenantId);
        // Usamos HttpStatus.CREATED (201) para cumplir con el estándar REST
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingRequestResponseDto> changeRequestStatus(
            @PathVariable("id") UUID requestId,
            @RequestParam RequestStatus status,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        // CORREGIDO: Reordenados los parámetros para coincidir con la firma del Service
        BookingRequestResponseDto response = requestService.setStatusBookingRequest(status, requestId, currentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingRequestResponseDto> getBookingRequestById(
            @PathVariable("id") UUID requestId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        BookingRequestResponseDto response = requestService.getBookingRequestById(requestId, currentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tenant")
    public ResponseEntity<Page<BookingRequestResponseDto>> getTenantRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        Page<BookingRequestResponseDto> response = requestService.getTenantBookingRequests(page, size, currentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/landlord")
    public ResponseEntity<Page<BookingRequestResponseDto>> getLandlordRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) UUID listingId, // Parámetro opcional para filtrar por un coliving
                                                            // específico
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        Page<BookingRequestResponseDto> response = requestService.getLandlordBookingRequests(page, size, currentUserId,
                listingId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<BookingRequestResponseDto>> getAllRequestsForAdmin(
            BookingRequestAdminFilterDto filterDto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<BookingRequestResponseDto> response = requestService.getAllBookingRequestsForAdmin(filterDto, page, size);
        return ResponseEntity.ok(response);
    }
}
