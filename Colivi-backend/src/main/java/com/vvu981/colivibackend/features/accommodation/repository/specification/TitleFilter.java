package com.vvu981.colivibackend.features.accommodation.repository.specification;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class TitleFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("title") && params.get("title") != null && !params.get("title").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.like(
                criteriaBuilder.lower(root.get("title")),
                "%" + params.get("title").toLowerCase() + "%");
    }
}
