package com.vvu981.colivibackend.features.home.controller;

import com.vvu981.colivibackend.features.home.dto.ActivityLogResponseDto;
import com.vvu981.colivibackend.features.home.service.ActivityLogQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/homes/{homeId}/activities")
@RequiredArgsConstructor
public class HomeActivityController {

    private final ActivityLogQueryService activityLogQueryService;

    @GetMapping
    public ResponseEntity<Page<ActivityLogResponseDto>> getHomeActivities(
            @PathVariable UUID homeId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "id") UUID requestUserId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ActivityLogResponseDto> activities = activityLogQueryService.getHomeActivities(homeId, requestUserId, pageable);
        return ResponseEntity.ok(activities);
    }
}
