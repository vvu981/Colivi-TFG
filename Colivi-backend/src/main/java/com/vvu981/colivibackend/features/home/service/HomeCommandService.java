package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.dto.CreateHomeRequest;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.JoinHomeRequest;

import java.util.UUID;

/**
 * Contrato de comandos (escritura) del módulo Home.
 * Solo los clientes que necesiten mutar hogares dependen de esta interfaz (ISP).
 */
public interface HomeCommandService {

    /**
     * Crea un nuevo hogar y asigna al creador como ADMIN activo.
     */
    HomeDetailResponseDto createHome(CreateHomeRequest request, UUID userId);

    /**
     * Une al usuario al hogar identificado por el código de invitación.
     * Si ya existía como LEFT/ARCHIVED, reactiva la membresía con rol MEMBER
     * (el rol de ADMIN previo no se restaura automáticamente).
     */
    HomeDetailResponseDto joinHome(JoinHomeRequest request, UUID userId);

    /**
     * El usuario sale voluntariamente del hogar (ACTIVE → LEFT).
     * El hogar pasa a ser visible en la pestaña "Salidos".
     * Si es el único miembro activo y es ADMIN, se realiza un softDelete automático.
     * Deniega la operación si es el único ADMIN y quedan otros miembros activos.
     */
    void leaveHome(UUID homeId, UUID userId);

    /**
     * Expulsa a un miembro del hogar (ACTIVE → LEFT).
     * Solo puede ser ejecutado por el ADMIN actual y no puede usarse sobre sí mismo.
     */
    void expelMember(UUID homeId, UUID adminUserId, UUID targetUserId);

    /**
     * Oculta el hogar de la vista principal del usuario (LEFT → ARCHIVED).
     * Solo puede ejecutarse cuando el miembro ya ha salido del hogar (status LEFT).
     * Para archivar, primero hay que salir con {@link #leaveHome}.
     */
    void archiveHomeView(UUID homeId, UUID userId);

    /**
     * Restaura la visibilidad del hogar (ARCHIVED → LEFT).
     * El hogar vuelve a aparecer en la pestaña "Salidos".
     */
    void unarchiveHomeView(UUID homeId, UUID userId);

    /**
     * Transfiere el rol de ADMIN a otro miembro activo del hogar.
     * Solo puede ser ejecutado por el ADMIN actual.
     * Tras la transferencia, el ejecutor pasa a tener rol MEMBER.
     */
    void transferAdmin(UUID homeId, UUID currentUserId, UUID targetUserId);

    /**
     * Borrado lógico del hogar.
     * Puede ejecutarse por un Administrador del Sistema, o por el ADMIN del hogar 
     * únicamente si es el único miembro activo.
     */
    void softDeleteHome(UUID homeId, UUID userId);

    /**
     * Borrado físico del hogar y en cascada de sus miembros.
     * Exclusivo para administradores del sistema. Irreversible.
     */
    void hardDeleteHome(UUID homeId, UUID userId);
}
