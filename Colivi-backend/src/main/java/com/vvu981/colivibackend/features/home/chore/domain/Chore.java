package com.vvu981.colivibackend.features.home.chore.domain;

import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.user.domain.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Chore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "series_id")
    private UUID seriesId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignee_id", nullable = false)
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_id")
    private User completedBy;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_points", nullable = false)
    private Integer basePoints = 10;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ChoreStatus status = ChoreStatus.PENDING;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version = 0;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = ChoreStatus.PENDING;
        }
        if (this.basePoints == null) {
            this.basePoints = 10;
        }
    }

    public boolean isLate(LocalDate referenceDate) {
        return this.dueDate != null && referenceDate != null && this.dueDate.isBefore(referenceDate);
    }

    public boolean isPending() {
        return this.status == ChoreStatus.PENDING;
    }

    public boolean isCompleted() {
        return this.status == ChoreStatus.COMPLETED || this.status == ChoreStatus.LATE_COMPLETED;
    }
}
