package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.dto.ActivityLogResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ActivityLogQueryService {
    Page<ActivityLogResponseDto> getHomeActivities(UUID homeId, UUID requestUserId, Pageable pageable);
}
