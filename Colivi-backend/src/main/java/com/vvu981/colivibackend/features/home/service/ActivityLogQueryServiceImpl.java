package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.dto.ActivityLogResponseDto;
import com.vvu981.colivibackend.features.home.mapper.ActivityLogMapper;
import com.vvu981.colivibackend.features.home.repository.ActivityLogRepository;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityLogQueryServiceImpl implements ActivityLogQueryService {

    private final ActivityLogRepository activityLogRepository;
    private final HomeMemberRepository homeMemberRepository;
    private final ActivityLogMapper activityLogMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityLogResponseDto> getHomeActivities(UUID homeId, UUID requestUserId, Pageable pageable) {
        HomeMember member = homeMemberRepository.findByHomeIdAndUserId(homeId, requestUserId)
                .orElseThrow(() -> new ResourceNotFoundException("No eres miembro de este hogar."));

        if (member.getStatus() != HomeMemberStatus.ACTIVE && member.getStatus() != HomeMemberStatus.LEFT && member.getStatus() != HomeMemberStatus.ARCHIVED) {
            throw new BusinessRuleValidationException("No tienes permiso para ver el historial de actividad de este hogar.");
        }

        if (member.getStatus() == HomeMemberStatus.LEFT || member.getStatus() == HomeMemberStatus.ARCHIVED) {
            return activityLogRepository.findByHomeIdAndCreatedAtLessThanEqualOrderByCreatedAtDesc(homeId, member.getLeftAt(), pageable)
                    .map(activityLogMapper::toResponseDto);
        }

        return activityLogRepository.findByHomeIdOrderByCreatedAtDesc(homeId, pageable)
                .map(activityLogMapper::toResponseDto);
    }
}
