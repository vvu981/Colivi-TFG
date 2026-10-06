package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.dto.ActivityLogResponseDto;
import com.vvu981.colivibackend.features.home.mapper.ActivityLogMapper;
import com.vvu981.colivibackend.features.home.repository.ActivityLogRepository;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLogQueryServiceImplTest {

    @Mock
    private ActivityLogRepository activityLogRepository;
    @Mock
    private HomeMemberRepository homeMemberRepository;
    @Mock
    private ActivityLogMapper activityLogMapper;

    @InjectMocks
    private ActivityLogQueryServiceImpl service;

    private UUID homeId;
    private UUID userId;
    private HomeMember member;

    @BeforeEach
    void setUp() {
        homeId = UUID.randomUUID();
        userId = UUID.randomUUID();
        member = new HomeMember();
        member.setStatus(HomeMemberStatus.ACTIVE);
        member.setJoinedAt(LocalDateTime.now().minusDays(5));
    }

    @Test
    void getHomeActivities_Success() {
        when(homeMemberRepository.findByHomeIdAndUserId(homeId, userId)).thenReturn(Optional.of(member));

        ActivityLog log = new ActivityLog();
        User actor = new User();
        actor.setId(userId);
        actor.setFirstName("Test");
        actor.setLastName1("User");
        log.setActor(actor);
        Home home = new Home();
        home.setId(homeId);
        log.setHome(home);

        Pageable pageable = PageRequest.of(0, 10);
        Page<ActivityLog> page = new PageImpl<>(List.of(log));
        when(activityLogRepository.findByHomeIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(homeId,
                member.getJoinedAt(), pageable)).thenReturn(page);

        when(activityLogMapper.toResponseDto(log)).thenReturn(
                new ActivityLogResponseDto(UUID.randomUUID(), homeId, userId, "Test User", ActivityType.HOME_CREATED,
                        "desc", Map.of(), LocalDateTime.now()));

        Page<ActivityLogResponseDto> result = service.getHomeActivities(homeId, userId, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(activityLogRepository).findByHomeIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(homeId,
                member.getJoinedAt(), pageable);
    }

    @Test
    void getHomeActivities_Success_WhenMemberIsLeft() {
        member.setStatus(HomeMemberStatus.LEFT);
        member.setLeftAt(LocalDateTime.now().minusDays(1));
        when(homeMemberRepository.findByHomeIdAndUserId(homeId, userId)).thenReturn(Optional.of(member));

        ActivityLog log = new ActivityLog();
        User actor = new User();
        actor.setId(userId);
        actor.setFirstName("Test");
        actor.setLastName1("User");
        log.setActor(actor);
        Home home = new Home();
        home.setId(homeId);
        log.setHome(home);

        Pageable pageable = PageRequest.of(0, 10);
        Page<ActivityLog> page = new PageImpl<>(List.of(log));
        when(activityLogRepository.findByHomeIdAndCreatedAtBetweenOrderByCreatedAtDesc(homeId, member.getJoinedAt(),
                member.getLeftAt(), pageable)).thenReturn(page);

        when(activityLogMapper.toResponseDto(log)).thenReturn(
                new ActivityLogResponseDto(UUID.randomUUID(), homeId, userId, "Test User", ActivityType.HOME_CREATED,
                        "desc", Map.of(), LocalDateTime.now()));

        Page<ActivityLogResponseDto> result = service.getHomeActivities(homeId, userId, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(activityLogRepository).findByHomeIdAndCreatedAtBetweenOrderByCreatedAtDesc(homeId, member.getJoinedAt(),
                member.getLeftAt(), pageable);
    }

    @Test
    void getHomeActivities_Success_WhenMemberIsArchived() {
        member.setStatus(HomeMemberStatus.ARCHIVED);
        member.setLeftAt(LocalDateTime.now().minusDays(1));
        when(homeMemberRepository.findByHomeIdAndUserId(homeId, userId)).thenReturn(Optional.of(member));

        ActivityLog log = new ActivityLog();
        User actor = new User();
        actor.setId(userId);
        actor.setFirstName("Test");
        actor.setLastName1("User");
        log.setActor(actor);
        Home home = new Home();
        home.setId(homeId);
        log.setHome(home);

        Pageable pageable = PageRequest.of(0, 10);
        Page<ActivityLog> page = new PageImpl<>(List.of(log));
        when(activityLogRepository.findByHomeIdAndCreatedAtBetweenOrderByCreatedAtDesc(homeId, member.getJoinedAt(),
                member.getLeftAt(), pageable)).thenReturn(page);

        when(activityLogMapper.toResponseDto(log)).thenReturn(
                new ActivityLogResponseDto(UUID.randomUUID(), homeId, userId, "Test User", ActivityType.HOME_CREATED,
                        "desc", Map.of(), LocalDateTime.now()));

        Page<ActivityLogResponseDto> result = service.getHomeActivities(homeId, userId, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(activityLogRepository).findByHomeIdAndCreatedAtBetweenOrderByCreatedAtDesc(homeId, member.getJoinedAt(),
                member.getLeftAt(), pageable);
    }

    @Test
    void getHomeActivities_ThrowsIfNotFound() {
        when(homeMemberRepository.findByHomeIdAndUserId(homeId, userId)).thenReturn(Optional.empty());

        Pageable pageable = PageRequest.of(0, 10);
        assertThrows(ResourceNotFoundException.class, () -> service.getHomeActivities(homeId, userId, pageable));
    }

}
