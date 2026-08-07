package com.vvu981.colivibackend.features.home.mapper;

import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeMemberResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Responsable exclusivamente de transformar entidades del dominio Home en DTOs de salida.
 *
 * <p>Extraído de los DTOs para cumplir el Principio de Responsabilidad Única (SRP):
 * los records DTO son ahora contenedores de datos puros, sin conocimiento del dominio.</p>
 */
@Component
public class HomeMapper {

    /**
     * Mapea un {@link HomeMember} a su DTO de representación pública.
     */
    public HomeMemberResponseDto toMemberDto(HomeMember member) {
        return new HomeMemberResponseDto(
                member.getUser().getId(),
                member.getUser().getFirstName() + " " + member.getUser().getLastName1(),
                member.getUser().getEmail(),
                member.getRole(),
                member.getStatus(),
                member.getJoinedAt(),
                member.getLeftAt()
        );
    }

    /**
     * Mapea un {@link Home} con la perspectiva del miembro actual a un DTO de listado ligero.
     */
    public HomeResponseDto toResponseDto(Home home, HomeMember currentMember) {
        return new HomeResponseDto(
                home.getId(),
                home.getName(),
                home.getInvitationCode(),
                currentMember.getRole(),
                currentMember.getStatus(),
                countActiveMembers(home),
                home.getCreatedAt()
        );
    }

    /**
     * Mapea un {@link Home} con la perspectiva del miembro actual a un DTO de detalle completo.
     */
    public HomeDetailResponseDto toDetailDto(Home home, HomeMember currentMember) {
        List<HomeMemberResponseDto> memberDtos = home.getMembers().stream()
                .map(this::toMemberDto)
                .toList();

        return new HomeDetailResponseDto(
                home.getId(),
                home.getName(),
                home.getInvitationCode(),
                currentMember.getRole(),
                currentMember.getStatus(),
                countActiveMembers(home),
                home.getCreatedAt(),
                memberDtos
        );
    }

    private long countActiveMembers(Home home) {
        return home.getMembers().stream()
                .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE)
                .count();
    }
}
