package com.vvu981.colivibackend.features.recommendation.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("RecommendationCriteria DTO")
class RecommendationCriteriaTest {

    @Test
    @DisplayName("getResolvedType returns rentalType when not blank")
    void getResolvedType_ReturnsRentalType() {
        RecommendationCriteria criteria = RecommendationCriteria.builder()
                .rentalType("ROOM")
                .accommodationType("ENTIRE_PLACE")
                .build();
        assertThat(criteria.getResolvedType()).isEqualTo("ROOM");
    }

    @Test
    @DisplayName("getResolvedType returns accommodationType when rentalType is null or blank")
    void getResolvedType_ReturnsAccommodationTypeWhenRentalTypeNullOrBlank() {
        RecommendationCriteria criteria1 = RecommendationCriteria.builder()
                .rentalType(null)
                .accommodationType("ENTIRE_PLACE")
                .build();
        assertThat(criteria1.getResolvedType()).isEqualTo("ENTIRE_PLACE");

        RecommendationCriteria criteria2 = RecommendationCriteria.builder()
                .rentalType("   ")
                .accommodationType("STUDIO")
                .build();
        assertThat(criteria2.getResolvedType()).isEqualTo("STUDIO");
    }

    @Test
    @DisplayName("getParsedAmenities returns empty list when null or blank")
    void getParsedAmenities_ReturnsEmptyListWhenNullOrBlank() {
        RecommendationCriteria criteria1 = RecommendationCriteria.builder().amenities(null).build();
        assertThat(criteria1.getParsedAmenities()).isEmpty();

        RecommendationCriteria criteria2 = RecommendationCriteria.builder().amenities("   ").build();
        assertThat(criteria2.getParsedAmenities()).isEmpty();
    }

    @Test
    @DisplayName("getParsedAmenities parses comma-separated list and filters out empty tokens")
    void getParsedAmenities_ParsesAndFiltersEmptyTokens() {
        RecommendationCriteria criteria = RecommendationCriteria.builder()
                .amenities("WIFI, , BALCONY,  AIR_CONDITIONING  , ")
                .build();

        List<String> amenities = criteria.getParsedAmenities();
        assertThat(amenities).containsExactly("WIFI", "BALCONY", "AIR_CONDITIONING");
    }

    @Test
    @DisplayName("AllArgsConstructor, NoArgsConstructor, and Getters/Setters")
    void testConstructorsAndAccessors() {
        RecommendationCriteria criteria = new RecommendationCriteria(
                10, "Title", "Madrid", BigDecimal.valueOf(100), BigDecimal.valueOf(500),
                "ROOM", "ROOM", "WIFI"
        );

        assertThat(criteria.getLimit()).isEqualTo(10);
        assertThat(criteria.getTitle()).isEqualTo("Title");
        assertThat(criteria.getCity()).isEqualTo("Madrid");
        assertThat(criteria.getMinPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(criteria.getMaxPrice()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(criteria.getRentalType()).isEqualTo("ROOM");
        assertThat(criteria.getAccommodationType()).isEqualTo("ROOM");
        assertThat(criteria.getAmenities()).isEqualTo("WIFI");
        assertThat(criteria.toString()).contains("Madrid");
        assertThat(criteria.hashCode()).isNotZero();
        assertThat(criteria.equals(criteria)).isTrue();
        assertThat(criteria.equals(null)).isFalse();
    }
}
