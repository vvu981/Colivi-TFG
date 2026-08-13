package com.vvu981.colivibackend.features.recommendation.service;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RecommendationService {

    /**
     * Retrieves a list of recommended listings based on the user's search history
     * or provided parameters (for anonymous users). If not enough matches are found,
     * it performs a Cold Start fallback.
     *
     * @param userId optional authenticated user ID
     * @param limit max number of recommendations to return
     * @param city optional city for anonymous fallback
     * @param maxPrice optional max price for anonymous fallback
     * @param accommodationType optional accommodation type for anonymous fallback
     * @return list of recommended listings
     */
    List<AccommodationListingResponse> getRecommendations(UUID userId, Integer limit, String city, BigDecimal maxPrice, String accommodationType);
}
