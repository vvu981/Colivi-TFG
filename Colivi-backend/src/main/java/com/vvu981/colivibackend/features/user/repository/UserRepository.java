package com.vvu981.colivibackend.features.user.repository;

import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByIdAndDeletedAtIsNull(UUID userId);

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    Optional<User> findByNicknameAndDeletedAtIsNull(String nickname);

    List<User> findAllByDeletedAtIsNull();

    @Modifying
    @Query("UPDATE User u SET u.role = 'ADMIN' WHERE u.id = :targetUserId AND u.deletedAt IS NULL")
    void setAdmin(@Param("targetUserId") UUID targetUserId);

    /**
     * Busca un usuario por su token de reactivación, independientemente de si la
     * cuenta está activa o eliminada (soft-delete). No filtra por {@code deletedAt}
     * intencionalmente: precisamente buscamos usuarios que necesitan ser reactivados.
     *
     * @param token el token UUID de reactivación.
     * @return el usuario asociado al token, o vacío si no existe o ya fue limpiado.
     */
    Optional<User> findByReactivationToken(String token);

    /**
     * Busca un usuario por su email incluyendo cuentas soft-deleted.
     *
     * <p>A diferencia de {@link #findByEmailAndDeletedAtIsNull}, este método no
     * filtra por {@code deletedAt}, lo que permite localizar cuentas eliminadas
     * durante el flujo de reactivación.</p>
     *
     * @param email dirección de correo del usuario (case-insensitive).
     * @return el usuario, independientemente de su estado de borrado.
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Busca un usuario por su email exacto, sin filtrar por {@code deletedAt}.
     *
     * <p>Utilizado exclusivamente por {@code JwtAuthenticationFilter} para cargar
     * el principal en el {@code SecurityContext} con independencia del estado de la
     * cuenta. El control de estado (baneado / eliminado) es responsabilidad del
     * {@code UserStatusEnforcerFilter} posterior.</p>
     *
     * @param email dirección de correo del usuario.
     * @return el usuario, independientemente de su estado de borrado o baneo.
     */
    Optional<User> findByEmail(String email);
}