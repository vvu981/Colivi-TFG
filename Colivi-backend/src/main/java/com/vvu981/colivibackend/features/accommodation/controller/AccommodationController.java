package com.vvu981.colivibackend.features.accommodation.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationService;
import com.vvu981.colivibackend.features.user.domain.User;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/accommodation")
@RequiredArgsConstructor
public class AccommodationController {

    private final AccommodationService accommodationService;

    @GetMapping
    public ResponseEntity<Page<Accommodation>> getCatalog(
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(defaultValue = "AVAILABLE") AccommodationVisibility visibility,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Accommodation> catalog = accommodationService.getAccommodationsCatalog(ownerId, visibility, page, size);
        return ResponseEntity.ok(catalog);
    }

    @PostMapping
    public ResponseEntity<Accommodation> create(
            @RequestBody AccommodationRequest request,
            @AuthenticationPrincipal User currentUser) {
        Accommodation created = accommodationService.createAccommodation(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Accommodation> update(
            @PathVariable("id") UUID accommodationId,
            @RequestBody AccommodationRequest request,
            @AuthenticationPrincipal User currentUser) {

        Accommodation updated = accommodationService.updateAccommodation(accommodationId, request, currentUser);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/delete/{id}")
    public ResponseEntity<Accommodation> softDelete(@PathVariable("id") UUID accommodationId,
            @AuthenticationPrincipal User currentUser) {
        Accommodation deleted = accommodationService.deleteAccommodationSoft(accommodationId, currentUser);
        return ResponseEntity.ok(deleted);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/hardDelete/{id}")
    public ResponseEntity<Void> hardDelete(@PathVariable("id") UUID accommodationId,
            @AuthenticationPrincipal User currentUser) {

        accommodationService.deleteAccommodationHard(accommodationId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Accommodation> getAccommodation(@PathVariable("id") UUID accommodationId) {
        Accommodation accommodation = accommodationService.getAccommodation(accommodationId);
        return ResponseEntity.ok(accommodation);
    }
}
