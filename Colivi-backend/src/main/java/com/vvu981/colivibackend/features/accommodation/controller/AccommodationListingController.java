package com.vvu981.colivibackend.features.accommodation.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationListingService;
import com.vvu981.colivibackend.features.recommendation.service.SearchHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
public class AccommodationListingController {

    private final AccommodationListingService listingService;
    private final SearchHistoryService searchHistoryService;

    @GetMapping
    public ResponseEntity<Page<AccommodationListingResponse>> getPublicCatalog(
            @RequestParam Map<String, String> allParams,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal com.vvu981.colivibackend.core.security.UserPrincipal userPrincipal) {

        Page<AccommodationListingResponse> catalog = listingService.searchListings(allParams, page, size);

        UUID currentUserId = userPrincipal != null ? userPrincipal.getId() : null;

        // Save search async
        if (currentUserId != null) {
            String city = allParams.get("city");
            String maxPriceStr = allParams.get("maxPrice");
            java.math.BigDecimal maxPrice = null;
            try {
                if (maxPriceStr != null && !maxPriceStr.trim().isEmpty()) {
                    maxPrice = new java.math.BigDecimal(maxPriceStr);
                }
            } catch (NumberFormatException e) {
                throw new com.vvu981.colivibackend.core.exception.BusinessRuleValidationException(
                        "Invalid maxPrice value");
            }
            String type = allParams.get("rentalType"); // Or whatever the frontend sends

            searchHistoryService.saveSearchAsync(currentUserId, city, maxPrice, type);
        }

        return ResponseEntity.ok(catalog);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccommodationListingResponse> updateListing(
            @PathVariable("id") UUID listingId, // Atrapamos el ID desde la URL
            @Valid @RequestBody AccommodationListingUpdateRequest updateRequest, // Atrapamos los cambios del JSON
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) { // Atrapamos al usuario que navega

        AccommodationListingResponse updated = listingService.updateAccommodationListing(listingId, updateRequest,
                currentUserId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping
    public ResponseEntity<AccommodationListingResponse> createAccommodationListing(
            @Valid @RequestBody AccommodationListingRequest listingRequest,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        AccommodationListingResponse request = listingService.createAccommodationListing(listingRequest, currentUserId);

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(request);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/ban/{id}")
    public ResponseEntity<Void> banAccommodationListing(
            @PathVariable("id") UUID listingId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        listingService.banAccommodationListing(listingId, currentUserId);

        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/unban/{id}")
    public ResponseEntity<Void> unBanAccommodationListing(
            @PathVariable("id") UUID listingId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        listingService.unBanAccommodationListing(listingId, currentUserId);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/softDelete/{id}")
    public ResponseEntity<Void> softDeleteAccommodationListing(@PathVariable("id") UUID listingId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        listingService.deleteAccommodationListingSoft(listingId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/hardDelete/{id}")
    public ResponseEntity<Void> hardDeleteAccommodationListing(@PathVariable("id") UUID listingId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        listingService.deleteAccommodationListingHard(listingId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/recover/{id}")
    public ResponseEntity<AccommodationListingResponse> recoverAccommodationListing(
            @PathVariable("id") UUID listingId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        AccommodationListingResponse listingResponse = listingService.recoverAccommodationListing(listingId,
                currentUserId);

        return ResponseEntity.ok(listingResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccommodationListingResponse> getAccommodationListing(
            @PathVariable("id") UUID listingId,
            @AuthenticationPrincipal com.vvu981.colivibackend.core.security.UserPrincipal userPrincipal) {
        UUID currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        AccommodationListingResponse listingResponse = listingService.getAccommodationListing(listingId, currentUserId);
        return ResponseEntity.ok(listingResponse);
    }

    @GetMapping("/accommodation/{id}")
    public ResponseEntity<List<AccommodationListingResponse>> getListingsByAccommodationId(
            @PathVariable("id") UUID accommodationId) {
        return ResponseEntity.ok(listingService.findAvailableListingsByAccommodationId(accommodationId));
    }

    @PatchMapping("/status/{id}")
    public ResponseEntity<Void> changeStatus(@PathVariable("id") UUID listingId,
            @Valid @RequestBody com.vvu981.colivibackend.features.accommodation.dto.ChangeStatusRequest request,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        listingService.changeStatusListing(listingId, request.status(), currentUserId);
        return ResponseEntity.noContent().build();

    }

}
