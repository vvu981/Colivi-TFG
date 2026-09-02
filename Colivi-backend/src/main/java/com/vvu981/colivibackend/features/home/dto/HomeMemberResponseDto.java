package com.vvu981.colivibackend.features.home.dto;

import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Proyección de un miembro de hogar con datos de usuario e información de membresía.
 * Contenedor de datos puro: la transformación desde el dominio es responsabilidad de {@code HomeMapper}.
 */
public record HomeMemberResponseDto(
        UUID userId,
        String fullName,
        String email,
        String profilePicUrl,
        HomeRole role,
        HomeMemberStatus status,
        LocalDateTime joinedAt,
        LocalDateTime leftAt
) {}
