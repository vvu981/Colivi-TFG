package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;

@Component
public class ListingStatusFilter implements ListingFilter {

    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params.containsKey("status") && !params.get("status").isEmpty();
    }

    @Override
    public Specification<AccommodationListing> apply(Map<String, String> params) {
        return (root, query, cb) -> {
            try {
                ListingStatus status = ListingStatus.valueOf(params.get("status").toUpperCase());
                return cb.equal(root.get("status"), status);
            } catch (IllegalArgumentException e) {
                // Ignore invalid status parameter
                return cb.conjunction();
            }
        };
    }
}
