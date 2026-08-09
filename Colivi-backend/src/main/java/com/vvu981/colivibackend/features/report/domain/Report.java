package com.vvu981.colivibackend.features.report.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reporter_id")
    private UUID reporterId; // Opcional, foreign key en BD permite nulos para GDPR

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "resolver_id")
    private UUID resolverId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // Métodos de dominio (Tell, Don't Ask)
    
    public void investigate(UUID adminId) {
        if (this.status == ReportStatus.RESOLVED || this.status == ReportStatus.DISMISSED) {
            throw new IllegalStateException("No se puede investigar una denuncia cerrada.");
        }
        this.status = ReportStatus.INVESTIGATING;
        this.resolverId = adminId;
    }

    public void resolve(String adminNotes, UUID resolverId) {
        if (this.status == ReportStatus.RESOLVED) {
            throw new IllegalStateException("La denuncia ya ha sido resuelta.");
        }
        this.status = ReportStatus.RESOLVED;
        this.adminNotes = adminNotes;
        this.resolverId = resolverId;
        this.resolvedAt = LocalDateTime.now();
    }

    public void dismiss(String adminNotes, UUID resolverId) {
        if (this.status == ReportStatus.DISMISSED) {
            throw new IllegalStateException("La denuncia ya ha sido descartada.");
        }
        this.status = ReportStatus.DISMISSED;
        this.adminNotes = adminNotes;
        this.resolverId = resolverId;
        this.resolvedAt = LocalDateTime.now();
    }
}
