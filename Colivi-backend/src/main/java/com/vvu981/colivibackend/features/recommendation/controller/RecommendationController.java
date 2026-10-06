package com.vvu981.colivibackend.features.recommendation.controller;

import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.recommendation.dto.RecommendationCriteria;
import com.vvu981.colivibackend.features.recommendation.dto.RecommendationResponse;
import com.vvu981.colivibackend.features.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/listings/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<RecommendationResponse> getRecommendations(
            @Valid @ModelAttribute RecommendationCriteria criteria,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        UUID currentUserId = userPrincipal != null ? userPrincipal.getId() : null;

        RecommendationResponse recommendations = recommendationService.getRecommendations(
                currentUserId,
                criteria.getLimit(),
                criteria.getTitle(),
                criteria.getCity(),
                criteria.getMinPrice(),
                criteria.getMaxPrice(),
                criteria.getResolvedType(),
                criteria.getParsedAmenities()
        );

        return ResponseEntity.ok(recommendations);
    }
}
