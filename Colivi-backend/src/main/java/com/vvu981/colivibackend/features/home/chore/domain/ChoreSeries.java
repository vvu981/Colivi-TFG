package com.vvu981.colivibackend.features.home.chore.domain;

import com.vvu981.colivibackend.features.home.domain.Home;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "chore_series")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChoreSeries {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_points", nullable = false)
    private Integer basePoints = 10;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false, length = 30)
    private RecurrenceType recurrenceType = RecurrenceType.NONE;

    @Column(name = "occurrences", nullable = false)
    private Integer occurrences = 1;

    @Column(name = "custom_days_of_week", length = 50)
    private String customDaysOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "rotation_type", nullable = false, length = 30)
    private RotationType rotationType = RotationType.FIXED;

    @Column(name = "last_assignee_index", nullable = false)
    private Integer lastAssigneeIndex = 0;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "chore_series_participants", joinColumns = @JoinColumn(name = "series_id"))
    @OrderColumn(name = "order_index")
    @Column(name = "user_id", nullable = false)
    private List<UUID> participantOrder = new ArrayList<>();

    @Version
    @Column(name = "version", nullable = false)
    private Integer version = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.basePoints == null) {
            this.basePoints = 10;
        }
        if (this.recurrenceType == null) {
            this.recurrenceType = RecurrenceType.NONE;
        }
        if (this.occurrences == null) {
            this.occurrences = 1;
        }
        if (this.rotationType == null) {
            this.rotationType = RotationType.FIXED;
        }
        if (this.lastAssigneeIndex == null) {
            this.lastAssigneeIndex = 0;
        }
        if (this.version == null) {
            this.version = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean removeParticipant(UUID userId) {
        if (userId == null || participantOrder.isEmpty()) {
            return false;
        }
        boolean removed = participantOrder.remove(userId);
        if (removed) {
            if (participantOrder.isEmpty()) {
                this.lastAssigneeIndex = 0;
            } else if (this.lastAssigneeIndex >= participantOrder.size()) {
                this.lastAssigneeIndex = 0;
            }
        }
        return removed;
    }

    public void addParticipant(UUID userId) {
        if (userId != null && !participantOrder.contains(userId)) {
            participantOrder.add(userId);
        }
    }

    public boolean hasParticipants() {
        return participantOrder != null && !participantOrder.isEmpty();
    }
}
