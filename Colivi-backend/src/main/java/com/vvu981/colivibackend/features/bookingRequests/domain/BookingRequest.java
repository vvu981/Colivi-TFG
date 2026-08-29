package com.vvu981.colivibackend.features.bookingRequests.domain;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ─── Relaciones ─────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accommodation_listing_id", nullable = false)
    private AccommodationListing accommodationListing;

    // ─── Datos de la Solicitud (Lógica Coliving) ────────────────────────────────

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    // ─── Estado y Auditoría ──────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Version
    private Integer version;


    // ─── Payment Information ─────────────────────────────────────────────────────

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    // ─── Lifecycle ───────────────────────────────────────────────────────────────

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public BookingRequest(BookingRequestDto requestDTO, User requester, AccommodationListing listing) {
        this.requester = requester;
        this.accommodationListing = listing;
        this.startDate = requestDTO.startDate();
        this.endDate = requestDTO.endDate();
        this.message = requestDTO.message();
        this.status = RequestStatus.PENDING;
    }

    // ─── Lógica de Dominio (Transiciones de Estado) ──────────────────────────────

    public void accept() {
        if (this.status != RequestStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden aceptar solicitudes pendientes.");
        }
        this.status = RequestStatus.ACCEPTED;
        this.expiresAt = LocalDateTime.now().plusHours(72);
    }

    public void reject() {
        if (this.status != RequestStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden rechazar solicitudes pendientes.");
        }
        this.status = RequestStatus.REJECTED;
    }

    public void cancel() {
        if (this.status != RequestStatus.PENDING && this.status != RequestStatus.ACCEPTED) {
            throw new IllegalStateException("Solo se pueden cancelar solicitudes pendientes o aceptadas.");
        }
        this.status = RequestStatus.CANCELLED;
    }

    public void confirm(String transactionId, String paymentMethod) {
        if (this.status != RequestStatus.ACCEPTED) {
            throw new IllegalStateException("Solo se pueden confirmar solicitudes aceptadas previamente por el propietario.");
        }
        this.status = RequestStatus.CONFIRMED;
        this.transactionId = transactionId;
        this.paymentMethod = paymentMethod;
    }

    public void expire() {
        if (this.status != RequestStatus.ACCEPTED) {
            throw new IllegalStateException("Solo se pueden caducar solicitudes que estén en estado ACCEPTED.");
        }
        this.status = RequestStatus.EXPIRED;
    }
}
