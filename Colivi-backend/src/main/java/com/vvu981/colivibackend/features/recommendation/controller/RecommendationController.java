package com.vvu981.colivibackend.features.recommendation.controller;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/listings/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<List<AccommodationListingResponse>> getRecommendations(
            @RequestParam(defaultValue = "6") int limit,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String accommodationType,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {

        List<AccommodationListingResponse> recommendations = recommendationService.getRecommendations(
                currentUserId, limit, city, maxPrice, accommodationType
        );

        return ResponseEntity.ok(recommendations);
    }
}
