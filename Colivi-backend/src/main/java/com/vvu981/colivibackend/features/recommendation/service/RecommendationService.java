package com.vvu981.colivibackend.features.recommendation.service;

import com.vvu981.colivibackend.features.recommendation.dto.RecommendationResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RecommendationService {

    /**
     * Retrieves recommendations based on the user's search history
     * or provided parameters (for anonymous users). If not enough matches are found,
     * it performs a Cold Start fallback.
     *
     * @param userId optional authenticated user ID
     * @param limit max number of recommendations to return
     * @param city optional city for anonymous fallback
     * @param minPrice optional minimum price
     * @param maxPrice optional max price for anonymous fallback
     * @param accommodationType optional accommodation type for anonymous fallback
     * @param amenities optional list of amenities
     * @return RecommendationResponse containing recommended listings and fallback metadata
     */
    RecommendationResponse getRecommendations(
            UUID userId,
            Integer limit,
            String title,
            String city,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String accommodationType,
            List<String> amenities);

    default RecommendationResponse getRecommendations(
            UUID userId,
            Integer limit,
            String city,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String accommodationType,
            List<String> amenities) {
        return getRecommendations(userId, limit, null, city, minPrice, maxPrice, accommodationType, amenities);
    }

    default RecommendationResponse getRecommendations(
            UUID userId,
            Integer limit,
            String city,
            BigDecimal maxPrice,
            String accommodationType) {
        return getRecommendations(userId, limit, null, city, null, maxPrice, accommodationType, null);
    }
}
