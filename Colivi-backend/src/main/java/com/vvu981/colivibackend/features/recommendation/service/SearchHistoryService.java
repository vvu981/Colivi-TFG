package com.vvu981.colivibackend.features.recommendation.service;

import java.math.BigDecimal;
import java.util.UUID;

public interface SearchHistoryService {
    
    /**
     * Asynchronously saves a user search to avoid blocking the main thread.
     * Prevents flooding by checking if an identical search was made recently (e.g. 5 minutes).
     *
     * @param userId UUID of the authenticated user (must be explicitly passed to avoid SecurityContext issues in async)
     * @param city the city searched
     * @param maxPrice the max price searched
     * @param accommodationType the type of accommodation searched
     */
    void saveSearchAsync(UUID userId, String city, BigDecimal maxPrice, String accommodationType);
}
