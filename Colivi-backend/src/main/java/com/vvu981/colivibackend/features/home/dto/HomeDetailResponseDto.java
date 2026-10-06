package com.vvu981.colivibackend.features.home.dto;

import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Proyección completa de un hogar incluyendo la lista de todos sus miembros.
 * Contenedor de datos puro: la transformación desde el dominio es responsabilidad de {@code HomeMapper}.
 */
public record HomeDetailResponseDto(
        UUID id,
        String name,
        String invitationCode,
        HomeRole myRole,
        HomeMemberStatus myStatus,
        long totalActiveMembers,
        LocalDateTime createdAt,
        List<HomeMemberResponseDto> members
) {}
