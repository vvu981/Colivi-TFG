package com.vvu981.colivibackend.features.accommodation.domain;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

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
    private ListingStatus status; // PENDIENTE, ACTIVO, RECHAZADO, FINALIZADO

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus previousStatus;

    @Version
    private Integer version; // Control de concurrencia optimista exigido en tu SPEC

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

    public AccommodationListing(AccommodationListingRequest dto, Accommodation accommodation) {
        this.accommodation = accommodation;
        this.host = accommodation.getOwner();
        this.title = dto.title();
        this.description = dto.description();
        this.pricePerMonth = dto.pricePerMonth();
        this.securityDeposit = dto.securityDeposit();
        this.rentalType = dto.rentalType();
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

}
