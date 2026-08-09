package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.dto.CreateHomeRequest;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;
import com.vvu981.colivibackend.features.home.dto.JoinHomeRequest;

import java.util.List;
import java.util.UUID;

public interface HomeService {

    HomeDetailResponseDto createHome(CreateHomeRequest request, UUID userId);

    HomeDetailResponseDto joinHome(JoinHomeRequest request, UUID userId);

    void leaveHome(UUID homeId, UUID userId);

    void expelMember(UUID homeId, UUID adminUserId, UUID targetUserId);

    void forceExpelWithDebtSettlement(UUID homeId, UUID adminUserId, UUID targetUserId, String reason);

    void archiveHomeView(UUID homeId, UUID userId);

    void unarchiveHomeView(UUID homeId, UUID userId);

    HomeDetailResponseDto regenerateInvitationCode(UUID homeId, UUID userId);

    void transferAdmin(UUID homeId, UUID currentUserId, UUID targetUserId);

    void softDeleteHome(UUID homeId, UUID userId);

    void hardDeleteHome(UUID homeId, UUID userId);

    List<HomeResponseDto> getUserHomes(UUID userId, HomeMemberStatus statusFilter);

    HomeDetailResponseDto getHomeDetail(UUID homeId, UUID userId);
}
