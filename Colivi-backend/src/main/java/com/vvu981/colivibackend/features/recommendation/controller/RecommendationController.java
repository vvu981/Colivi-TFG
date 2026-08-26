package com.vvu981.colivibackend.features.recommendation.controller;

import com.vvu981.colivibackend.features.recommendation.dto.RecommendationResponse;
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
    public ResponseEntity<RecommendationResponse> getRecommendations(
            @RequestParam(defaultValue = "6") int limit,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String rentalType,
            @RequestParam(required = false) String accommodationType,
            @RequestParam(required = false) String amenities,
            @AuthenticationPrincipal com.vvu981.colivibackend.core.security.UserPrincipal userPrincipal) {

        UUID currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        String resolvedType = (rentalType != null && !rentalType.isBlank()) ? rentalType : accommodationType;
        List<String> parsedAmenities = (amenities != null && !amenities.isBlank())
                ? java.util.Arrays.stream(amenities.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : null;

        RecommendationResponse recommendations = recommendationService.getRecommendations(
                currentUserId, limit, title, city, minPrice, maxPrice, resolvedType, parsedAmenities
        );

        return ResponseEntity.ok(recommendations);
    }
}
