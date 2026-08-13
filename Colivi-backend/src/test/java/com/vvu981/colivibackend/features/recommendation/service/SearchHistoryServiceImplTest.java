package com.vvu981.colivibackend.features.recommendation.service;

import com.vvu981.colivibackend.features.recommendation.domain.UserSearchHistory;
import com.vvu981.colivibackend.features.recommendation.repository.UserSearchHistoryRepository;
import com.vvu981.colivibackend.features.recommendation.service.impl.SearchHistoryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchHistoryServiceImplTest {

    @Mock
    private UserSearchHistoryRepository historyRepository;

    @InjectMocks
    private SearchHistoryServiceImpl searchHistoryService;

    @Test
    void saveSearchAsync_NullUserId_DoesNothing() {
        searchHistoryService.saveSearchAsync(null, "Madrid", BigDecimal.valueOf(500), "ROOM");
        verify(historyRepository, never()).existsRecentSearch(any(), any(), any(), any(), any());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void saveSearchAsync_RecentSearchExists_DoesNothing() {
        UUID userId = UUID.randomUUID();
        when(historyRepository.existsRecentSearch(eq(userId), eq("Madrid"), eq(BigDecimal.valueOf(500)), eq("ROOM"), any(LocalDateTime.class)))
                .thenReturn(true);

        searchHistoryService.saveSearchAsync(userId, "Madrid", BigDecimal.valueOf(500), "ROOM");

        verify(historyRepository, times(1)).existsRecentSearch(eq(userId), eq("Madrid"), eq(BigDecimal.valueOf(500)), eq("ROOM"), any(LocalDateTime.class));
        verify(historyRepository, never()).save(any());
    }

    @Test
    void saveSearchAsync_NoRecentSearch_SavesNewHistory() {
        UUID userId = UUID.randomUUID();
        when(historyRepository.existsRecentSearch(eq(userId), eq("Madrid"), eq(BigDecimal.valueOf(500)), eq("ROOM"), any(LocalDateTime.class)))
                .thenReturn(false);

        searchHistoryService.saveSearchAsync(userId, "Madrid", BigDecimal.valueOf(500), "ROOM");

        ArgumentCaptor<UserSearchHistory> captor = ArgumentCaptor.forClass(UserSearchHistory.class);
        verify(historyRepository, times(1)).save(captor.capture());

        UserSearchHistory saved = captor.getValue();
        assertEquals(userId, saved.getUserId());
        assertEquals("Madrid", saved.getCity());
        assertEquals(BigDecimal.valueOf(500), saved.getMaxPrice());
        assertEquals("ROOM", saved.getAccommodationType());
    }

    @Test
    void saveSearchAsync_RepositoryThrowsException_CatchesAndLogs() {
        UUID userId = UUID.randomUUID();
        when(historyRepository.existsRecentSearch(eq(userId), eq("Madrid"), eq(BigDecimal.valueOf(500)), eq("ROOM"), any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("DB Error"));

        // Should not throw exception out of the method since it catches Exception
        assertDoesNotThrow(() -> {
            searchHistoryService.saveSearchAsync(userId, "Madrid", BigDecimal.valueOf(500), "ROOM");
        });

        verify(historyRepository, never()).save(any());
    }
}
