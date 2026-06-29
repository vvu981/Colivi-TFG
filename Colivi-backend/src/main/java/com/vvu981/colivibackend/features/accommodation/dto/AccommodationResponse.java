package com.vvu981.colivibackend.features.accommodation.dto;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccommodationResponse {

    private UUID id;
    private String address;
    private Integer totalRooms;
    private Integer totalBathrooms;
    private Integer freeRooms;
    private Integer squareMeters;
    private String city;
    private String country;
    private String province;
    private Double latitude;
    private Double longitude;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<AmenityType> amenities;
    private UUID ownerId;
    private String ownerNickname; // Muy útil para que el frontend muestre el nombre del casero
    private List<AccommodationImageResponse> images;

    // El constructor mágico que transforma la entidad en una respuesta limpia
    public AccommodationResponse(Accommodation accommodation) {
        if (accommodation != null) {
            this.id = accommodation.getId();
            this.address = accommodation.getAddress();
            this.totalRooms = accommodation.getTotalRooms();
            this.totalBathrooms = accommodation.getTotalBathrooms();
            this.freeRooms = accommodation.getFreeRooms();
            this.squareMeters = accommodation.getSquareMeters();
            this.city = accommodation.getCity();
            this.country = accommodation.getCountry();
            this.province = accommodation.getProvince();
            this.latitude = accommodation.getLatitude();
            this.longitude = accommodation.getLongitude();
            this.deletedAt = accommodation.getDeletedAt();
            this.createdAt = accommodation.getCreatedAt();
            this.updatedAt = accommodation.getUpdatedAt();

            // Copia segura de las comodidades (amenities)
            this.amenities = accommodation.getAmenities() != null
                    ? new HashSet<>(accommodation.getAmenities())
                    : new HashSet<>();

            // Extraemos solo lo necesario del propietario para cuidar la seguridad
            if (accommodation.getOwner() != null) {
                this.ownerId = accommodation.getOwner().getId();
                this.ownerNickname = accommodation.getOwner().getNickname();
            }

            // Mapeamos la lista de imágenes físicas a sus DTOs planos correspondientes
            this.images = accommodation.getImages() != null
                    ? accommodation.getImages().stream()
                            .map(img -> AccommodationImageResponse.builder()
                                    .id(img.getId())
                                    .imageUrl(img.getImageUrl())
                                    .displayOrder(img.getDisplayOrder())
                                    .build())
                            .collect(Collectors.toList())
                    : new ArrayList<>();
        }
    }
}