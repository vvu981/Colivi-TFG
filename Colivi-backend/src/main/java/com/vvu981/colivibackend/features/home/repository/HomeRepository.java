package com.vvu981.colivibackend.features.home.repository;

import com.vvu981.colivibackend.features.home.domain.Home;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HomeRepository extends JpaRepository<Home, UUID>, JpaSpecificationExecutor<Home> {

    /**
     * Busca una vivienda activa (no eliminada lógicamente) por su código de invitación.
     */
    Optional<Home> findByInvitationCodeAndDeletedAtIsNull(String invitationCode);

    /**
     * Comprueba si existe un código de invitación (incluso en hogares soft-deleted)
     * para respetar la restricción UNIQUE de la base de datos.
     */
    boolean existsByInvitationCode(String invitationCode);

    /**
     * Busca una vivienda activa (no eliminada lógicamente) por su ID.
     */
    Optional<Home> findByIdAndDeletedAtIsNull(UUID id);
}
