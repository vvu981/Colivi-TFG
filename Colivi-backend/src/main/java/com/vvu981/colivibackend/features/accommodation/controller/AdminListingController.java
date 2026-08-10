package com.vvu981.colivibackend.features.accommodation.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationListingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/listings")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminListingController {

    private final AccommodationListingService listingService;

    @GetMapping
    public ResponseEntity<Page<AccommodationListingResponse>> searchAllListings(
            @RequestParam Map<String, String> allParams,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<AccommodationListingResponse> catalog = listingService.searchAllListingsForAdmin(allParams, page, size);
        return ResponseEntity.ok(catalog);
    }
}
