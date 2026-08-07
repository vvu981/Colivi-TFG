package com.vvu981.colivibackend.features.home.dto;

import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Proyección ligera de un hogar para vistas de listado.
 * Contenedor de datos puro: la transformación desde el dominio es responsabilidad de {@code HomeMapper}.
 */
public record HomeResponseDto(
        UUID id,
        String name,
        String invitationCode,
        HomeRole myRole,
        HomeMemberStatus myStatus,
        long totalActiveMembers,
        LocalDateTime createdAt
) {}
