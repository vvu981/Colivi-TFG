package com.vvu981.colivibackend.features.accommodation.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AccommodationListingRequest(

                UUID accommodationId, // id del accommodation fisico
                String title,
                String description,
                BigDecimal pricePerMonth) {

}
