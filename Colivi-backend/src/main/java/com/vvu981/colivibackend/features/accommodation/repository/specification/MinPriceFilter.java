package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.math.BigDecimal;
import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;

@Component
public class MinPriceFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("minPrice") && params.get("minPrice") != null
                && !params.get("minPrice").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        try {
            BigDecimal minPrice = new BigDecimal(params.get("minPrice"));
            return (root, query, criteriaBuilder) -> criteriaBuilder.greaterThanOrEqualTo(root.get("pricePerMonth"),
                    minPrice);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("El formato del precio mínimo no es válido.");
        }
    }
}
