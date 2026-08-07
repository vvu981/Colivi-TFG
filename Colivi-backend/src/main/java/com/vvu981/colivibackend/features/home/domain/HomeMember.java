package com.vvu981.colivibackend.features.home.domain;

import com.vvu981.colivibackend.features.user.domain.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "home_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "home_id", "user_id" }) // Un usuario no puede estar 2 veces en la misma casa
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HomeMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private HomeRole role;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private HomeMemberStatus status = HomeMemberStatus.ACTIVE;

    @PrePersist
    protected void onCreate() {
        this.joinedAt = LocalDateTime.now();
    }

    /**
     * Transiciona el estado del miembro a LEFT y registra la fecha de salida.
     */
    public void leave() {
        this.status = HomeMemberStatus.LEFT;
        this.leftAt = LocalDateTime.now();
    }

    /**
     * Transiciona el estado del miembro a ARCHIVED para ocultarlo de las vistas habituales.
     */
    public void archive() {
        this.status = HomeMemberStatus.ARCHIVED;
    }

    /**
     * Reactiva la membresía limpiando la fecha de salida y pasando a ACTIVE.
     * Se usa cuando un ex-miembro vuelve a unirse al hogar con código de invitación.
     * El rol siempre se restablece a MEMBER: el historial de roles no persiste.
     */
    public void reactivate() {
        this.status = HomeMemberStatus.ACTIVE;
        this.role = HomeRole.MEMBER;
        this.leftAt = null;
    }

    /**
     * Restaura la visibilidad del hogar pasando de ARCHIVED a LEFT.
     * La fecha de salida original se conserva porque el miembro sigue sin participar.
     */
    public void unarchive() {
        this.status = HomeMemberStatus.LEFT;
    }
}