package com.vvu981.colivibackend.features.messaging.domain;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "conversations",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_conversation_tenant_host_listing",
            columnNames = {"tenant_id", "host_id", "listing_id"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ─── Desacoplamiento: Anclaje unívoco a Inmueble y Participantes ──────────────

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private AccommodationListing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    // ─── Enlace Dinámico a Reserva (Opcional, nace de la conversación) ───────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_booking_request_id")
    private BookingRequest activeBookingRequest;

    // ─── Metadatos de Resumen para Inbox y Paginación ────────────────────────────

    @Column(name = "last_message_at", nullable = false)
    @Builder.Default
    private LocalDateTime lastMessageAt = LocalDateTime.now();

    @Column(name = "last_message_preview", length = 160)
    private String lastMessagePreview;

    @Column(name = "tenant_unread_count", nullable = false)
    @Builder.Default
    private Integer tenantUnreadCount = 0;

    @Column(name = "host_unread_count", nullable = false)
    @Builder.Default
    private Integer hostUnreadCount = 0;

    // ─── Estrategia de Nudges y Control de Anfitrión ─────────────────────────────

    @Column(name = "user_message_count", nullable = false)
    @Builder.Default
    private Integer userMessageCount = 0;

    @Column(name = "nudge_sent", nullable = false)
    @Builder.Default
    private Boolean nudgeSent = false;

    @Column(name = "archived_by_host", nullable = false)
    @Builder.Default
    private Boolean archivedByHost = false;

    @Column(name = "archived_by_tenant", nullable = false)
    @Builder.Default
    private Boolean archivedByTenant = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
