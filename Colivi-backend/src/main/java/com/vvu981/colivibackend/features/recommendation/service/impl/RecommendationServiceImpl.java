package com.vvu981.colivibackend.features.recommendation.service.impl;

import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final AccommodationListingRepository listingRepository;
    private final UserSearchHistoryRepository historyRepository;

    private record SearchContext(
            String title,
            String city,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            RentalType accommodationType,
            List<AmenityType> amenities,
            boolean hasCriteria
    ) {}

    private SearchContext resolveSearchContext(
            UUID userId, String title, String city, BigDecimal minPrice,
            BigDecimal maxPrice, String accommodationType, List<String> amenities) {
        
        boolean hasExplicitCriteria = (title != null && !title.isBlank())
                || (city != null && !city.isBlank())
                || (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) > 0)
                || (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0)
                || (accommodationType != null && !accommodationType.isBlank())
                || (amenities != null && !amenities.isEmpty());

        String resolvedCity = city;
        BigDecimal resolvedMaxPrice = maxPrice;
        String resolvedTypeStr = accommodationType;

        if (userId != null && !hasExplicitCriteria) {
            Optional<UserSearchHistory> latestOpt = historyRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
            if (latestOpt.isPresent()) {
                UserSearchHistory latest = latestOpt.get();
                hasExplicitCriteria = (latest.getCity() != null && !latest.getCity().isBlank())
                        || (latest.getMaxPrice() != null && latest.getMaxPrice().compareTo(BigDecimal.ZERO) > 0)
                        || (latest.getAccommodationType() != null && !latest.getAccommodationType().isBlank());
                
                resolvedCity = latest.getCity();
                resolvedMaxPrice = latest.getMaxPrice();
                resolvedTypeStr = latest.getAccommodationType();
            }
        }

        RentalType parsedType = null;
        if (resolvedTypeStr != null && !resolvedTypeStr.isBlank()) {
            try {
                parsedType = RentalType.valueOf(resolvedTypeStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid accommodation type: {}", resolvedTypeStr);
                throw new com.vvu981.colivibackend.core.exception.BusinessRuleValidationException(
                        "Tipo de alojamiento no válido: " + resolvedTypeStr);
            }
        }

        List<AmenityType> parsedAmenities = new ArrayList<>();
        if (amenities != null && !amenities.isEmpty()) {
            for (String am : amenities) {
                try {
                    parsedAmenities.add(AmenityType.valueOf(am.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid amenity type: {}", am);
                    throw new com.vvu981.colivibackend.core.exception.BusinessRuleValidationException(
                            "Amenidad no válida: " + am);
                }
            }
        }

        return new SearchContext(title, resolvedCity, minPrice, resolvedMaxPrice, parsedType, parsedAmenities, hasExplicitCriteria);
    }

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
        
        SearchContext ctx = resolveSearchContext(userId, title, city, minPrice, maxPrice, accommodationType, amenities);
        
        List<AccommodationListing> recommendedListings = new ArrayList<>();
        int criteriaMatchedCount = 0;
        Pageable pageRequest = PageRequest.of(0, maxResults, Sort.by(Sort.Direction.DESC, "isPromoted", "createdAt"));

        if (ctx.hasCriteria()) {
            Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(
                    ctx.title(), ctx.city(), ctx.minPrice(), ctx.maxPrice(), ctx.accommodationType(), ctx.amenities(), null
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
                    null, ctx.city(), null, null, ctx.accommodationType(), null, excludedIds
            );

            Pageable fallbackPageRequest = PageRequest.of(0, remaining, Sort.by(Sort.Direction.DESC, "isPromoted", "createdAt"));
            Page<AccommodationListing> fallbackResults = listingRepository.findAll(fallbackSpec, fallbackPageRequest);

            if (!fallbackResults.isEmpty()) {
                if (ctx.hasCriteria()) {
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
                .hasCriteria(ctx.hasCriteria())
                .searchCity(ctx.city())
                .searchTitle(ctx.title())
                .build();
    }
}
