package com.vvu981.colivibackend.features.accommodation.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.user.domain.User;

@Entity
@Table(name = "accommodation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Accommodation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @ElementCollection(targetClass = AmenityType.class, fetch = FetchType.LAZY)
    @CollectionTable(name = "accommodation_amenity", joinColumns = @JoinColumn(name = "accommodation_id"))
    @Column(name = "amenity_name", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<AmenityType> amenities = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    public Accommodation(AccommodationRequest dto, User owner) {
        this.address = dto.address();
        this.totalRooms = dto.totalRooms();
        this.totalBathrooms = dto.totalBathrooms();
        this.freeRooms = dto.freeRooms();
        this.squareMeters = dto.squareMeters();
        this.city = dto.city();
        this.country = dto.country();
        this.province = dto.province();
        this.latitude = dto.latitude();
        this.longitude = dto.longitude();
        this.owner = owner;

        // Inicializamos y copiamos las amenities de forma segura
        this.amenities = new HashSet<>();
        if (dto.amenities() != null) {
            this.amenities.addAll(dto.amenities());
        }
    }

}