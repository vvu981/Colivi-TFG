package com.vvu981.colivibackend.features.accommodation.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "listing_image_selection")
@org.hibernate.annotations.BatchSize(size = 50)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingImageSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private AccommodationListing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id", nullable = false)
    private AccommodationImage image;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
