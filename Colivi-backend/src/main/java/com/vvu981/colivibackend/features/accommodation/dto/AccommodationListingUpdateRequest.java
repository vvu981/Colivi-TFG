package com.vvu981.colivibackend.features.accommodation.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AccommodationListingUpdateRequest(

                String title,

                String description,

                BigDecimal pricePerMonth,

                List<UUID> selectedImages) {

}
