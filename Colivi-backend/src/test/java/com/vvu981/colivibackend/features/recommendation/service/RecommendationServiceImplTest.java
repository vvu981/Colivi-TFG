package com.vvu981.colivibackend.features.recommendation.service;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.recommendation.domain.UserSearchHistory;
import com.vvu981.colivibackend.features.recommendation.dto.RecommendationResponse;
import com.vvu981.colivibackend.features.recommendation.repository.UserSearchHistoryRepository;
import com.vvu981.colivibackend.features.recommendation.service.impl.RecommendationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceImplTest {

    @Mock
    private AccommodationListingRepository listingRepository;

    @Mock
    private UserSearchHistoryRepository historyRepository;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    private UUID userId;
    private AccommodationListing listing1;
    private AccommodationListing listing2;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        listing1 = new AccommodationListing();
        listing1.setId(UUID.randomUUID());
        listing1.setTitle("Test 1");
        listing1.setPricePerMonth(new BigDecimal("500"));
        listing1.setSecurityDeposit(new BigDecimal("500"));
        listing1.setStatus(ListingStatus.AVAILABLE);
        listing1.setRentalType(RentalType.ROOM);
        listing1.setIsPromoted(true);

        listing2 = new AccommodationListing();
        listing2.setId(UUID.randomUUID());
        listing2.setTitle("Test 2");
        listing2.setPricePerMonth(new BigDecimal("600"));
        listing2.setSecurityDeposit(new BigDecimal("600"));
        listing2.setStatus(ListingStatus.AVAILABLE);
        listing2.setRentalType(RentalType.ROOM);
        listing2.setIsPromoted(false);
    }

    @Test
    void testGetRecommendations_WithHistory_MatchesCriteria() {
        // Arrange
        UserSearchHistory history = new UserSearchHistory();
        history.setCity("Madrid");
        history.setMaxPrice(new BigDecimal("800"));
        history.setAccommodationType("ROOM");

        when(historyRepository.findTop3ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(history));

        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(userId, 1, null, null,
                null);

        // Assert
        assertEquals(1, result.getItems().size());
        assertEquals(1, result.getCriteriaMatchedCount());
        assertFalse(result.isFallbackApplied());
        assertEquals(listing1.getId(), result.getItems().get(0).id());
        verify(historyRepository, times(1)).findTop3ByUserIdOrderByCreatedAtDesc(userId);
        // Fallback is not called since limit 1 is reached
        verify(listingRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void testGetRecommendations_ColdStart_Anonymous() {
        // Arrange
        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1, listing2));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(null, 6, null, null, null);

        // Assert
        assertEquals(2, result.getItems().size());
        assertEquals(0, result.getCriteriaMatchedCount());
        assertFalse(result.isFallbackApplied());
        assertFalse(result.isHasCriteria());
        verify(historyRepository, never()).findTop3ByUserIdOrderByCreatedAtDesc(any());
        // Only default query is executed because hasCriteria is false
        verify(listingRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void testGetRecommendations_WithHistory_RequiresFallback() {
        // Arrange
        UserSearchHistory history = new UserSearchHistory();
        history.setCity("Madrid");

        when(historyRepository.findTop3ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(history));

        // First query returns 1 item, but limit is 2
        Page<AccommodationListing> page1 = new PageImpl<>(List.of(listing1));

        // Second query (fallback) returns 1 more item
        Page<AccommodationListing> page2 = new PageImpl<>(List.of(listing2));

        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page1) // Criteria search
                .thenReturn(page2); // Fallback search

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(userId, 2, null, null,
                null);

        // Assert
        assertEquals(2, result.getItems().size());
        assertEquals(1, result.getCriteriaMatchedCount());
        assertTrue(result.isFallbackApplied());
        verify(historyRepository, times(1)).findTop3ByUserIdOrderByCreatedAtDesc(userId);
        verify(listingRepository, times(2)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void testGetRecommendations_NullLimit_UsesDefault() {
        // Arrange
        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(null, null, null, null, null);

        // Assert
        assertEquals(1, result.getItems().size());
    }

    @Test
    void testGetRecommendations_NegativeLimit_UsesDefault() {
        // Arrange
        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(null, -5, null, null, null);

        // Assert
        assertEquals(1, result.getItems().size());
    }

    @Test
    void testGetRecommendations_HistoryWithNullValues_UsesMethodArguments() {
        // Arrange
        UserSearchHistory history = new UserSearchHistory();
        // history has null city, maxPrice, type

        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(userId, 1, "Paris", new BigDecimal("100"), "FLAT");

        // Assert
        assertEquals(1, result.getItems().size());
    }

    @Test
    void testGetRecommendations_EmptyHistory_UsesMethodArguments() {
        // Arrange

        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(userId, 1, "London", null, null);

        // Assert
        assertEquals(1, result.getItems().size());
    }

    @Test
    void testGetRecommendations_NoHistoryAndNoCriteria_OnlyFallback() {
        // Arrange
        when(historyRepository.findTop3ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        // Act
        RecommendationResponse result = recommendationService.getRecommendations(userId, 1, null, null, null);

        // Assert
        assertEquals(1, result.getItems().size());
        assertFalse(result.isFallbackApplied());
        assertFalse(result.isHasCriteria());
    }

    @Test
    void testGetRecommendations_WithMinPriceAndAmenities() {
        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        RecommendationResponse result = recommendationService.getRecommendations(
                null, 1, "Valencia", new BigDecimal("200"), new BigDecimal("800"), "ROOM", List.of("WIFI", "AIR_CONDITIONING")
        );

        assertEquals(1, result.getItems().size());
    }

    @Test
    void testGetRecommendations_WithTitleCriteria() {
        Page<AccommodationListing> page = new PageImpl<>(List.of(listing1));
        when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        RecommendationResponse result = recommendationService.getRecommendations(
                null, 1, "Piso compartido", null, null, null, null, null
        );

        assertEquals(1, result.getItems().size());
        assertEquals("Piso compartido", result.getSearchTitle());
    }
}
