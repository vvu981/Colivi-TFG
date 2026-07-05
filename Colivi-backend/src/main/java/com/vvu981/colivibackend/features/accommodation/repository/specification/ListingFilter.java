package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;

public interface ListingFilter {
    // Indica si este filtro debe activarse según los parámetros de la URL
    boolean isApplicable(Map<String, String> params);

    // Genera la condición SQL/JPA correspondiente
    Specification<AccommodationListing> apply(Map<String, String> params);
}