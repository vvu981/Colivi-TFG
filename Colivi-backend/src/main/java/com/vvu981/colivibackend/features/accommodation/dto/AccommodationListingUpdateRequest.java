package com.vvu981.colivibackend.features.accommodation.dto;

import java.math.BigDecimal;

public record AccommodationListingUpdateRequest(

        String title,

        String description,

        BigDecimal pricePerMonth) {

}
