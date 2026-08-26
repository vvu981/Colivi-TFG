package com.vvu981.colivibackend.features.recommendation.service.impl;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.recommendation.domain.UserSearchHistory;
import com.vvu981.colivibackend.features.recommendation.dto.RecommendationResponse;
import com.vvu981.colivibackend.features.recommendation.repository.RecommendationSpecification;
import com.vvu981.colivibackend.features.recommendation.repository.UserSearchHistoryRepository;
import com.vvu981.colivibackend.features.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final AccommodationListingRepository listingRepository;
    private final UserSearchHistoryRepository historyRepository;

    @Override
    @Transactional(readOnly = true)
    public RecommendationResponse getRecommendations(
            UUID userId,
            Integer limit,
            String title,
            String city,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String accommodationType,
            List<String> amenities) {
        int maxResults = (limit != null && limit > 0) ? limit : 6;
        List<AccommodationListing> recommendedListings = new ArrayList<>();

        // 1. Resolve criteria
        String searchTitle = title;
        String searchCity = city;
        BigDecimal searchMinPrice = minPrice;
        BigDecimal searchMaxPrice = maxPrice;
        String searchType = accommodationType;
        List<String> searchAmenities = amenities;

        if (userId != null) {
            List<UserSearchHistory> recentSearches = historyRepository.findTop3ByUserIdOrderByCreatedAtDesc(userId);
            if (!recentSearches.isEmpty()) {
                // Use the most recent search that has at least some criteria, or just the very first one
                UserSearchHistory latest = recentSearches.get(0);
                searchCity = searchCity != null ? searchCity : latest.getCity();
                searchMaxPrice = searchMaxPrice != null ? searchMaxPrice : latest.getMaxPrice();
                searchType = searchType != null ? searchType : latest.getAccommodationType();
            }
        }

        // 2. Fetch based on criteria if any
        boolean hasCriteria = (searchTitle != null && !searchTitle.isBlank())
                || (searchCity != null && !searchCity.isBlank())
                || (searchMinPrice != null && searchMinPrice.compareTo(BigDecimal.ZERO) > 0)
                || (searchMaxPrice != null && searchMaxPrice.compareTo(BigDecimal.ZERO) > 0)
                || (searchType != null && !searchType.isBlank())
                || (searchAmenities != null && !searchAmenities.isEmpty());

        int criteriaMatchedCount = 0;
        Pageable pageRequest = PageRequest.of(0, maxResults, Sort.by(Sort.Direction.DESC, "isPromoted", "createdAt"));

        if (hasCriteria) {
            Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(
                    searchTitle, searchCity, searchMinPrice, searchMaxPrice, searchType, searchAmenities, null
            );

            Page<AccommodationListing> criteriaResults = listingRepository.findAll(spec, pageRequest);
            List<AccommodationListing> matches = criteriaResults.getContent();
            criteriaMatchedCount = matches.size();
            recommendedListings.addAll(matches);
        }

        boolean fallbackApplied = false;

        // 3. Cold Start / Fallback if we don't have enough results
        if (recommendedListings.size() < maxResults) {
            int remaining = maxResults - recommendedListings.size();
            List<UUID> excludedIds = recommendedListings.stream()
                    .map(AccommodationListing::getId)
                    .collect(Collectors.toList());

            Specification<AccommodationListing> fallbackSpec = RecommendationSpecification.buildRecommendationSpec(
                    null, null, null, null, null, null, excludedIds
            );

            Pageable fallbackPageRequest = PageRequest.of(0, remaining, Sort.by(Sort.Direction.DESC, "isPromoted", "createdAt"));
            Page<AccommodationListing> fallbackResults = listingRepository.findAll(fallbackSpec, fallbackPageRequest);

            if (!fallbackResults.isEmpty()) {
                if (hasCriteria) {
                    fallbackApplied = true;
                }
                recommendedListings.addAll(fallbackResults.getContent());
            }
        }

        List<AccommodationListingResponse> responseItems = recommendedListings.stream()
                .map(AccommodationListingResponse::new)
                .collect(Collectors.toList());

        return RecommendationResponse.builder()
                .items(responseItems)
                .totalCount(responseItems.size())
                .criteriaMatchedCount(criteriaMatchedCount)
                .fallbackApplied(fallbackApplied)
                .hasCriteria(hasCriteria)
                .searchCity(searchCity)
                .searchTitle(searchTitle)
                .build();
    }
}
