package com.vvu981.colivibackend.features.recommendation.dto;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private List<AccommodationListingResponse> items;
    private int totalCount;
    private int criteriaMatchedCount;
    private boolean fallbackApplied;
    private boolean hasCriteria;
    private String searchCity;
    private String searchTitle;
}
