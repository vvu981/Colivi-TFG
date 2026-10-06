package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;

@Component
public class AccommodationIdFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("accommodationId") && params.get("accommodationId") != null
                && !params.get("accommodationId").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        return (root, query, cb) -> {
            try {
                UUID accommodationId = UUID.fromString(params.get("accommodationId").trim());
                return cb.equal(root.get("accommodation").get("id"), accommodationId);
            } catch (IllegalArgumentException e) {
                // Si accommodationId no es un UUID valido, devolvemos una condicion que no se cumpla nunca
                return cb.disjunction();
            }
        };
    }
}
