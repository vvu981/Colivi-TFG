package com.vvu981.colivibackend.features.home.repository;

import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HomeMemberRepository extends JpaRepository<HomeMember, UUID> {

    /**
     * Busca la relación específica entre un usuario y un hogar.
     */
    Optional<HomeMember> findByHomeIdAndUserId(UUID homeId, UUID userId);

    /**
     * Retorna los hogares de un usuario filtrados por su estado de membresía,
     * excluyendo hogares eliminados lógicamente.
     */
    List<HomeMember> findByUserIdAndStatusAndHomeDeletedAtIsNull(UUID userId, HomeMemberStatus status);

    /**
     * Retorna todos los hogares de un usuario, excluyendo hogares eliminados lógicamente.
     */
    List<HomeMember> findByUserIdAndHomeDeletedAtIsNull(UUID userId);
}
