package com.vvu981.colivibackend.features.home.mapper;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.dto.ActivityLogResponseDto;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ActivityLogMapperTest {

    private ActivityLogMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ActivityLogMapper();
    }

    @Test
    @DisplayName("Should map to DTO when actor is present")
    void shouldMapToDtoWhenActorIsPresent() {
        // Arrange
        Home home = new Home();
        home.setId(UUID.randomUUID());

        User actor = new User();
        actor.setId(UUID.randomUUID());
        actor.setFirstName("John");
        actor.setLastName1("Doe");

        ActivityLog log = new ActivityLog();
        log.setId(UUID.randomUUID());
        log.setHome(home);
        log.setActor(actor);
        log.setActivityType(ActivityType.MEMBER_JOINED);
        log.setDescription("Joined");
        log.setCreatedAt(LocalDateTime.now());

        // Act
        ActivityLogResponseDto dto = mapper.toResponseDto(log);

        // Assert
        assertNotNull(dto);
        assertEquals(log.getId(), dto.id());
        assertEquals(home.getId(), dto.homeId());
        assertEquals(actor.getId(), dto.actorId());
        assertEquals("John Doe", dto.actorFullName());
        assertEquals(ActivityType.MEMBER_JOINED, dto.activityType());
        assertEquals("Joined", dto.description());
    }

    @Test
    @DisplayName("Should map to DTO when actor is null")
    void shouldMapToDtoWhenActorIsNull() {
        // Arrange
        Home home = new Home();
        home.setId(UUID.randomUUID());

        ActivityLog log = new ActivityLog();
        log.setId(UUID.randomUUID());
        log.setHome(home);
        log.setActor(null);
        log.setActivityType(ActivityType.MEMBER_LEFT);
        log.setDescription("Left");
        log.setCreatedAt(LocalDateTime.now());

        // Act
        ActivityLogResponseDto dto = mapper.toResponseDto(log);

        // Assert
        assertNotNull(dto);
        assertEquals(log.getId(), dto.id());
        assertEquals(home.getId(), dto.homeId());
        assertNull(dto.actorId());
        assertEquals("Usuario Eliminado", dto.actorFullName());
        assertEquals(ActivityType.MEMBER_LEFT, dto.activityType());
        assertEquals("Left", dto.description());
    }
}
