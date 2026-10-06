package com.vvu981.colivibackend.features.accommodation.domain;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;

@Entity
@Table(name = "accommodation_listing")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccommodationListing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // El puente hacia la casa física: Muchas publicaciones pueden apuntar a la
    // misma casa
    // El puente hacia la casa física
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accommodation_id", nullable = false)
    private Accommodation accommodation;

    // Quién publica el anuncio (Anfitrión / Propietario)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    // Usamos BigDecimal para dinero evitando Primitive Obsession y fallos de
    // redondeo
    @Column(name = "price_per_month", nullable = false)
    private BigDecimal pricePerMonth;

    @Column(name = "security_deposit", nullable = false)
    private BigDecimal securityDeposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus previousStatus;

    @Version
    private Integer version; // Control de concurrencia optimista exigido en tu SPEC

    @Column(name = "is_promoted", nullable = false)
    @Builder.Default
    private Boolean isPromoted = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "rental_type", nullable = false)
    private RentalType rentalType;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "banned_at")
    private LocalDateTime bannedAt;

    @Builder.Default
    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<ListingImageSelection> images = new ArrayList<>();

    public AccommodationListing(AccommodationListingRequest dto, Accommodation accommodation) {
        if (dto.pricePerMonth() == null || dto.pricePerMonth().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleValidationException("El precio mensual debe ser mayor a 0.");
        }
        if (dto.securityDeposit() == null || dto.securityDeposit().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleValidationException("El depósito de seguridad no puede ser negativo.");
        }
        this.accommodation = accommodation;
        this.host = accommodation.getOwner();
        this.title = dto.title();
        this.description = dto.description();
        this.pricePerMonth = dto.pricePerMonth();
        this.securityDeposit = dto.securityDeposit();
        this.rentalType = dto.rentalType();
        this.images = new ArrayList<>();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ListingStatus.AVAILABLE; // Red de seguridad técnica impecable
        }
        if (this.previousStatus == null) {
            this.previousStatus = ListingStatus.AVAILABLE;
        }
        if (this.isPromoted == null) {
            this.isPromoted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void ban() {
        if (!this.status.equals(ListingStatus.BANNED)) {
            this.previousStatus = this.status;
            this.status = ListingStatus.BANNED;
            this.bannedAt = LocalDateTime.now();
        }
    }

    public void unBan() {
        if (this.status.equals(ListingStatus.BANNED)) {
            this.status = this.previousStatus;
            this.bannedAt = null;
        }
    }

    public void updateImages(List<AccommodationImage> newImages) {
        List<UUID> newImageIds = newImages.stream()
                .map(AccommodationImage::getId)
                .toList();

        this.images.removeIf(selection -> !newImageIds.contains(selection.getImage().getId()));

        for (int i = 0; i < newImages.size(); i++) {
            AccommodationImage newImage = newImages.get(i);
            int displayOrder = i + 1;

            java.util.Optional<ListingImageSelection> existingSelection = this.images.stream()
                    .filter(selection -> selection.getImage().getId().equals(newImage.getId()))
                    .findFirst();

            if (existingSelection.isPresent()) {
                existingSelection.get().setDisplayOrder(displayOrder);
            } else {
                this.images.add(ListingImageSelection.builder()
                        .listing(this)
                        .image(newImage)
                        .displayOrder(displayOrder)
                        .build());
            }
        }
        
        this.images.sort(java.util.Comparator.comparing(ListingImageSelection::getDisplayOrder));
    }

    public void updateInformation(String title, String description, BigDecimal pricePerMonth, BigDecimal securityDeposit) {
        if (this.deletedAt != null) {
            throw new BusinessRuleValidationException("No se puede modificar un anuncio eliminado.");
        }
        if (this.status == ListingStatus.UNAVAILABLE || this.status == ListingStatus.BANNED) {
            throw new BusinessRuleValidationException("No se puede modificar un anuncio en estado " + this.status.name());
        }
        if (pricePerMonth == null || pricePerMonth.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleValidationException("El precio mensual debe ser mayor a 0.");
        }
        if (securityDeposit == null || securityDeposit.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleValidationException("El depósito de seguridad no puede ser negativo.");
        }
        this.title = title;
        this.description = description;
        this.pricePerMonth = pricePerMonth;
        this.securityDeposit = securityDeposit;
    }

}
