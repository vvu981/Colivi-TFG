package com.vvu981.colivibackend.features.accommodation.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationImageOrderRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/accommodation")
@RequiredArgsConstructor
public class AccommodationController {

    private final AccommodationService accommodationService;

    @GetMapping("/me")
    public ResponseEntity<Page<AccommodationResponse>> getMyAccommodations(
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(defaultValue = "AVAILABLE") AccommodationVisibility visibility,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        Page<AccommodationResponse> catalog = accommodationService.getMyAccommodations(ownerId, visibility, page,
                size, currentUserId);
        return ResponseEntity.ok(catalog);
    }

    @PostMapping
    public ResponseEntity<AccommodationResponse> create(
            @RequestBody AccommodationRequest request,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        AccommodationResponse created = accommodationService.createAccommodation(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccommodationResponse> update(
            @PathVariable("id") UUID accommodationId,
            @RequestBody AccommodationRequest request,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        AccommodationResponse updated = accommodationService.updateAccommodation(accommodationId, request,
                currentUserId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/delete/{id}")
    public ResponseEntity<AccommodationResponse> softDelete(@PathVariable("id") UUID accommodationId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        AccommodationResponse deleted = accommodationService.deleteAccommodationSoft(accommodationId, currentUserId);
        return ResponseEntity.ok(deleted);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/hardDelete/{id}")
    public ResponseEntity<Void> hardDelete(@PathVariable("id") UUID accommodationId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        accommodationService.deleteAccommodationHard(accommodationId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccommodationResponse> getAccommodation(@PathVariable("id") UUID accommodationId) {
        AccommodationResponse accommodation = accommodationService.getAccommodation(accommodationId);
        return ResponseEntity.ok(accommodation);
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AccommodationResponse> uploadImage(
            @PathVariable("id") UUID accommodationId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        AccommodationResponse updatedAccommodation = accommodationService.addImageToAccommodation(accommodationId, file,
                currentUserId);
        return ResponseEntity.ok(updatedAccommodation);
    }

    // ELIMINAR IMAGEN: Endpoint semántico, seguro y bien enrutado
    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable("id") UUID accommodationId,
            @PathVariable("imageId") UUID imageId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        accommodationService.removeImageFromAccommodation(accommodationId, imageId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/images/order")
    public ResponseEntity<AccommodationResponse> reorderImages(
            @PathVariable("id") UUID accommodationId,
            @RequestBody List<AccommodationImageOrderRequest> orderRequests,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        AccommodationResponse updated = accommodationService.updateImagesOrder(accommodationId, orderRequests,
                currentUserId);
        return ResponseEntity.ok(updated);
    }

}
