package com.vvu981.colivibackend.features.recommendation.repository;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class RecommendationSpecification {

    private RecommendationSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<AccommodationListing> buildRecommendationSpec(
            String city,
            BigDecimal maxPrice,
            String accommodationType,
            List<UUID> excludedIds) {
        return buildRecommendationSpec(null, city, null, maxPrice, accommodationType, null, excludedIds);
    }

    public static Specification<AccommodationListing> buildRecommendationSpec(
            String city,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String accommodationType,
            List<String> amenities,
            List<UUID> excludedIds) {
        return buildRecommendationSpec(null, city, minPrice, maxPrice, accommodationType, amenities, excludedIds);
    }

    public static Specification<AccommodationListing> buildRecommendationSpec(
            String title,
            String city,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String accommodationType,
            List<String> amenities,
            List<UUID> excludedIds) {
        
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Base criteria: Available and not deleted
            predicates.add(cb.equal(root.get("status"), ListingStatus.AVAILABLE));
            predicates.add(cb.isNull(root.get("deletedAt")));

            // Excluded IDs (for Cold Start to prevent duplicates)
            if (excludedIds != null && !excludedIds.isEmpty()) {
                predicates.add(cb.not(root.get("id").in(excludedIds)));
            }

            // Eager fetch to avoid N+1 problem ONLY for SELECT queries (never in COUNT queries)
            boolean isCountQuery = Long.class.equals(query.getResultType()) || long.class.equals(query.getResultType());
            Join<AccommodationListing, Accommodation> accommodationJoin;
            if (!isCountQuery) {
                @SuppressWarnings("unchecked")
                Join<AccommodationListing, Accommodation> fetchJoin = (Join<AccommodationListing, Accommodation>) (Object) root.fetch("accommodation", JoinType.INNER);
                accommodationJoin = fetchJoin;
                root.fetch("host", JoinType.LEFT);
            } else {
                accommodationJoin = root.join("accommodation", JoinType.INNER);
            }

            // Optional Criteria
            if (title != null && !title.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase().trim() + "%"));
            }

            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(accommodationJoin.get("city")), city.toLowerCase()));
            }

            if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerMonth"), minPrice));
            }

            if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerMonth"), maxPrice));
            }

            if (accommodationType != null && !accommodationType.trim().isEmpty()) {
                try {
                    RentalType type = RentalType.valueOf(accommodationType.toUpperCase());
                    predicates.add(cb.equal(root.get("rentalType"), type));
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Invalid accommodation type: " + accommodationType);
                }
            }

            if (amenities != null && !amenities.isEmpty()) {
                for (String am : amenities) {
                    try {
                        com.vvu981.colivibackend.features.accommodation.domain.AmenityType amenityType =
                                com.vvu981.colivibackend.features.accommodation.domain.AmenityType.valueOf(am.toUpperCase());
                        predicates.add(cb.isMember(amenityType, accommodationJoin.get("amenities")));
                    } catch (IllegalArgumentException ignored) {
                        throw new IllegalArgumentException("Amenidad no válida: " + am);
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
