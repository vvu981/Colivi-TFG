package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.math.BigDecimal;
import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;

@Component
public class MaxPriceFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params.containsKey("maxPrice") && params.get("maxPrice") != null && !params.get("maxPrice").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.lessThanOrEqualTo(root.get("pricePerMonth"),
                new BigDecimal(params.get("maxPrice")));
    }
}