package com.vvu981.colivibackend.features.accommodation.domain;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status; // PENDIENTE, ACTIVO, RECHAZADO, FINALIZADO

    @Version
    private Integer version; // Control de concurrencia optimista exigido en tu SPEC

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ListingStatus.PENDIENTE; // Todo anuncio nace pendiente de aprobación por Admin
        }
    }
}