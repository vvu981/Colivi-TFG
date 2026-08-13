package com.vvu981.colivibackend.features.recommendation.service.impl;

import com.vvu981.colivibackend.features.recommendation.domain.UserSearchHistory;
import com.vvu981.colivibackend.features.recommendation.repository.UserSearchHistoryRepository;
import com.vvu981.colivibackend.features.recommendation.service.SearchHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchHistoryServiceImpl implements SearchHistoryService {

    private final UserSearchHistoryRepository userSearchHistoryRepository;

    @Async
    @Override
    @Transactional
    public void saveSearchAsync(UUID userId, String city, BigDecimal maxPrice, String accommodationType) {
        if (userId == null) {
            log.debug("No user ID provided. Search history not saved for anonymous user.");
            return;
        }

        try {
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            boolean isDuplicate = userSearchHistoryRepository.existsRecentSearch(
                    userId, city, maxPrice, accommodationType, fiveMinutesAgo
            );

            if (isDuplicate) {
                log.debug("Duplicate search detected for user {} in the last 5 minutes. Skipping insert.", userId);
                return;
            }

            UserSearchHistory history = UserSearchHistory.builder()
                    .userId(userId)
                    .city(city)
                    .maxPrice(maxPrice)
                    .accommodationType(accommodationType)
                    .build();

            userSearchHistoryRepository.save(history);
            log.info("Saved search history for user {}", userId);

        } catch (Exception e) {
            log.error("Failed to save search history for user {}: {}", userId, e.getMessage());
        }
    }
}
