package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;

@Component
public class AmenitiesFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("amenities") && params.get("amenities") != null
                && !params.get("amenities").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        String raw = params.get("amenities");
        List<AmenityType> validAmenities = Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return AmenityType.valueOf(s.toUpperCase());
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Amenidad no válida: " + s);
                    }
                })
                .toList();

        if (validAmenities.isEmpty()) {
            return (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        }

        return (root, query, criteriaBuilder) -> {
            Join<AccommodationListing, Accommodation> accommodationJoin = root.join("accommodation");
            List<Predicate> predicates = new ArrayList<>();
            for (AmenityType amenity : validAmenities) {
                predicates.add(criteriaBuilder.isMember(amenity, accommodationJoin.get("amenities")));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
