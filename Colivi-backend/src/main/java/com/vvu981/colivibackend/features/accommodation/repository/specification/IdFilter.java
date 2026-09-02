package com.vvu981.colivibackend.features.accommodation.repository.specification;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class IdFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("id") && params.get("id") != null && !params.get("id").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        String idParam = params.get("id").trim().toLowerCase();
        return (root, query, cb) -> cb.like(
                cb.lower(root.get("id").as(String.class)),
                "%" + idParam + "%");
    }
}
