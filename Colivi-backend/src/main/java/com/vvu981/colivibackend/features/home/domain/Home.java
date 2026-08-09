package com.vvu981.colivibackend.features.home.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "homes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Home {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "invitation_code", nullable = false, unique = true)
    private String invitationCode;

    @OneToMany(mappedBy = "home", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HomeMember> members = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Mantiene la consistencia bidireccional al añadir un miembro.
     */
    public void addMember(HomeMember member) {
        members.add(member);
        member.setHome(this);
    }

    /**
     * Mantiene la consistencia bidireccional al eliminar un miembro.
     */
    public void removeMember(HomeMember member) {
        members.remove(member);
        member.setHome(null);
    }

    /**
     * Borrado lógico del hogar. No elimina la fila; marca la fecha de eliminación.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
