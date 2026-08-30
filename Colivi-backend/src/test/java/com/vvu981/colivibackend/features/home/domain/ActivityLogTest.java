package com.vvu981.colivibackend.features.home.domain;

import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("ActivityLog Domain Entity")
class ActivityLogTest {

    @Test
    @DisplayName("onCreate sets createdAt if null")
    void onCreate_SetsCreatedAtWhenNull() {
        ActivityLog log = new ActivityLog();
        log.onCreate();
        assertThat(log.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("onCreate preserves createdAt if already set")
    void onCreate_PreservesCreatedAtWhenAlreadySet() {
        LocalDateTime past = LocalDateTime.now().minusDays(2);
        ActivityLog log = new ActivityLog();
        log.setCreatedAt(past);
        log.onCreate();
        assertThat(log.getCreatedAt()).isEqualTo(past);
    }

    @Test
    @DisplayName("preventModification throws UnsupportedOperationException")
    void preventModification_ThrowsException() {
        ActivityLog log = new ActivityLog();
        assertThatThrownBy(log::preventModification)
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("inmutables");
    }

    @Test
    @DisplayName("AllArgsConstructor and Getters/Setters")
    void testAllArgsConstructorAndAccessors() {
        UUID id = UUID.randomUUID();
        Home home = new Home();
        User actor = new User();
        ActivityType type = ActivityType.HOME_CREATED;
        String desc = "Created home";
        Map<String, Object> meta = Map.of("k", "v");
        LocalDateTime now = LocalDateTime.now();

        ActivityLog log = new ActivityLog(id, home, actor, type, desc, meta, now);

        assertThat(log.getId()).isEqualTo(id);
        assertThat(log.getHome()).isEqualTo(home);
        assertThat(log.getActor()).isEqualTo(actor);
        assertThat(log.getActivityType()).isEqualTo(type);
        assertThat(log.getDescription()).isEqualTo(desc);
        assertThat(log.getMetadata()).isEqualTo(meta);
        assertThat(log.getCreatedAt()).isEqualTo(now);
    }
}
