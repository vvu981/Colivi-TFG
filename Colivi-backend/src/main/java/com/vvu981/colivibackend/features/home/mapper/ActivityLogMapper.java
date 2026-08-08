package com.vvu981.colivibackend.features.home.mapper;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.dto.ActivityLogResponseDto;
import org.springframework.stereotype.Component;

@Component
public class ActivityLogMapper {

    public ActivityLogResponseDto toResponseDto(ActivityLog log) {
        String actorFullName = log.getActor().getFirstName() + " " + log.getActor().getLastName1();
        return new ActivityLogResponseDto(
                log.getId(),
                log.getHome().getId(),
                log.getActor().getId(),
                actorFullName,
                log.getActivityType(),
                log.getDescription(),
                log.getMetadata(),
                log.getCreatedAt()
        );
    }
}
