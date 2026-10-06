package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;

@Component
public class RentalTypeFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("rentalType") && params.get("rentalType") != null && !params.get("rentalType").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        return (root, query, criteriaBuilder) -> {
            try {
                RentalType type = RentalType.valueOf(params.get("rentalType").toUpperCase());
                return criteriaBuilder.equal(root.get("rentalType"), type);
            } catch (IllegalArgumentException e) {
                // Return an always-true predicate if the rentalType string is invalid
                return criteriaBuilder.conjunction();
            }
        };
    }
}
