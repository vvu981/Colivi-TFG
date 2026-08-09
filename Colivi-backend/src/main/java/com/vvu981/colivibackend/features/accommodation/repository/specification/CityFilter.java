package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.Map;
import jakarta.persistence.criteria.Join; // 🔍 SOLUCIÓN: El import exacto que necesita tu IDE
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;

@Component
public class CityFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("city") && params.get("city") != null && !params.get("city").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        return (root, query, criteriaBuilder) -> {
            // Al tener el import arriba, aquí tu IDE ya sabrá perfectamente qué es un
            // 'Join'
            Join<AccommodationListing, Accommodation> accommodationJoin = root.join("accommodation");
            return criteriaBuilder.like(
                    criteriaBuilder.lower(accommodationJoin.get("city")),
                    "%" + params.get("city").toLowerCase() + "%");
        };
    }
}
