package com.vvu981.colivibackend.features.accommodation.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

    @Column(name = "address")
    private String address;

    @Column(name = "total_rooms")
    private Integer totalRooms;

    @Column(name = "total_bathrooms")
    private Integer totalBathrooms;

    @Column(name = "free_rooms")
    private Integer freeRooms;

    @Column(name = "square_meters")
    private Integer squareMeters;

    @Column(name = "city")
    private String city;

    @Column(name = "country")
    private String country;

    @Column(name = "province")
    private String province;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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

    @Builder.Default
    @OneToMany(mappedBy = "accommodation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AccommodationImage> images = new ArrayList<>();

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

        this.setCreatedAt(LocalDateTime.now());

        // Inicializamos y copiamos las amenities de forma segura
        this.amenities = new HashSet<>();
        if (dto.amenities() != null) {
            this.amenities.addAll(dto.amenities());
        }
    }
}