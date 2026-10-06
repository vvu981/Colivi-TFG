package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.features.home.chore.dto.*;

import java.util.List;
import java.util.UUID;

public interface ChoreService {

    List<ChoreResponseDto> createChore(UUID homeId, CreateChoreRequest request, UUID requestUserId);

    List<ChoreResponseDto> getChores(UUID homeId, ChoreFilterDto filter, UUID requestUserId);

    ChoreResponseDto completeChore(UUID homeId, UUID choreId, UUID requestUserId);

    void deleteChore(UUID homeId, UUID choreId, DeleteMode deleteMode, UUID requestUserId);

    ChoreLeaderboardDto getLeaderboard(UUID homeId, String period, UUID requestUserId);
}
