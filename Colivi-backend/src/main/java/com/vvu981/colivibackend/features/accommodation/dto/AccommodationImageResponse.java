package com.vvu981.colivibackend.features.accommodation.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccommodationImageResponse {
    private UUID id;
    private String imageUrl;
    private int displayOrder;
}