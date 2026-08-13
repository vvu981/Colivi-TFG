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

    public static Specification<AccommodationListing> buildRecommendationSpec(
            String city,
            BigDecimal maxPrice,
            String accommodationType,
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

            // Eager fetch to avoid N+1 problem
            jakarta.persistence.criteria.Fetch<AccommodationListing, Accommodation> accommodationFetch = root.fetch("accommodation", JoinType.INNER);
            root.fetch("host", JoinType.LEFT);

            // Optional Criteria
            if (city != null && !city.trim().isEmpty()) {
                Join<AccommodationListing, Accommodation> accommodationJoin = (Join<AccommodationListing, Accommodation>) accommodationFetch;
                predicates.add(cb.equal(cb.lower(accommodationJoin.get("city")), city.toLowerCase()));
            }

            if (maxPrice != null) {
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
