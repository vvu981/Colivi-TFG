package com.vvu981.colivibackend.features.recommendation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Strongly-typed request criteria DTO for recommendation queries.
 * Replaces long parameter list in controllers and adheres to Clean Code practices.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationCriteria {

    @Builder.Default
    @Min(value = 1, message = "Limit must be at least 1")
    @Max(value = 100, message = "Limit cannot exceed 100")
    private Integer limit = 6;

    private String title;
    private String city;

    @PositiveOrZero(message = "Minimum price must be zero or positive")
    private BigDecimal minPrice;

    @PositiveOrZero(message = "Maximum price must be zero or positive")
    private BigDecimal maxPrice;

    private String rentalType;
    private String accommodationType;
    private String amenities;

    /**
     * Resolves the rental type prioritizing rentalType over legacy accommodationType field.
     */
    public String getResolvedType() {
        if (rentalType != null && !rentalType.isBlank()) {
            return rentalType;
        }
        return accommodationType;
    }

    /**
     * Parses the comma-separated amenities string into a trimmed list of non-empty strings.
     */
    public List<String> getParsedAmenities() {
        if (amenities == null || amenities.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(amenities.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
