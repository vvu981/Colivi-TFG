package com.vvu981.colivibackend.features.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "\"user\"")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String firstName;

    @Column(name = "last_name_1", nullable = false)
    private String lastName1;

    @Column(name = "last_name_2")
    private String lastName2;

    private String phone;

    private String profilePicUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    private LocalDateTime deletedAt;

    private LocalDateTime bannedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    private Integer tokenVersion = 1;

    private LocalDateTime bannedUntil;

    private String banReason;

    /**
     * Token UUID generado al solicitar la reactivación de la cuenta.
     * Se limpia a {@code null} una vez que el usuario completa el proceso o caduca.
     */
    private String reactivationToken;

    /**
     * Marca de tiempo en la que el {@link #reactivationToken} deja de ser válido.
     * Se establece a 24 horas desde la solicitud.
     */
    private LocalDateTime reactivationTokenExpiresAt;

    public boolean isBanned() {
        if (bannedAt == null) {
            return false;
        }
        if (bannedUntil == null) {
            return true;
        }
        return LocalDateTime.now().isBefore(bannedUntil);
    }
}