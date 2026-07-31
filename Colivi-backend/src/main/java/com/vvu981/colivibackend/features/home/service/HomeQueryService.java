package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;

import java.util.List;
import java.util.UUID;

/**
 * Contrato de consulta del módulo Home.
 * Solo los clientes que necesiten leer hogares dependen de esta interfaz (ISP).
 */
public interface HomeQueryService {

    /**
     * Devuelve los hogares del usuario filtrados opcionalmente por su estado de membresía.
     * Si {@code statusFilter} es null, devuelve todos los hogares no eliminados del usuario.
     */
    List<HomeResponseDto> getUserHomes(UUID userId, HomeMemberStatus statusFilter);

    /**
     * Devuelve el detalle completo de un hogar en el que el usuario participa activamente.
     */
    HomeDetailResponseDto getHomeDetail(UUID homeId, UUID userId);
}
