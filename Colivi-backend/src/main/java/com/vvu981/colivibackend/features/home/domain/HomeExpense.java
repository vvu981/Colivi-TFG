package com.vvu981.colivibackend.features.home.domain;

import com.vvu981.colivibackend.features.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "home_expenses")
@Getter
@Setter
@NoArgsConstructor
public class HomeExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HomeExpenseParticipant> participants = new ArrayList<>();

    public void addParticipant(HomeExpenseParticipant participant) {
        participants.add(participant);
        participant.setExpense(this);
    }

    public void removeParticipant(HomeExpenseParticipant participant) {
        participants.remove(participant);
        participant.setExpense(null);
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
