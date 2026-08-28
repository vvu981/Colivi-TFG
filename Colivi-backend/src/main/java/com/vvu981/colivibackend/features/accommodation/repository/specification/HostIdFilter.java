package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;

@Component
public class HostIdFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params.containsKey("hostId") && params.get("hostId") != null && !params.get("hostId").isBlank();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        return (root, query, cb) -> {
            try {
                UUID hostId = UUID.fromString(params.get("hostId").trim());
                return cb.equal(root.get("accommodation").get("host").get("id"), hostId);
            } catch (IllegalArgumentException e) {
                // Si el hostId no es un UUID válido, devolvemos una condición que no se cumpla nunca
                return cb.disjunction();
            }
        };
    }
}
