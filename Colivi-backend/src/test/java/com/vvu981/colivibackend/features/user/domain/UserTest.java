package com.vvu981.colivibackend.features.user.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    @DisplayName("should ReturnFalse_When BannedAtIsNull")
    void shouldReturnFalse_WhenBannedAtIsNull() {
        // Arrange
        User user = new User();
        user.setBannedAt(null);

        // Act
        boolean result = user.isBanned();

        // Assert
        assertFalse(result, "User should not be banned if bannedAt is null");
    }

    @Test
    @DisplayName("should ReturnTrue_When BannedAtIsSetAndBannedUntilIsNull")
    void shouldReturnTrue_WhenBannedAtIsSetAndBannedUntilIsNull() {
        // Arrange
        User user = new User();
        user.setBannedAt(LocalDateTime.now().minusDays(1));
        user.setBannedUntil(null);

        // Act
        boolean result = user.isBanned();

        // Assert
        assertTrue(result, "User should be permanently banned if bannedAt is set and bannedUntil is null");
    }

    @Test
    @DisplayName("should ReturnTrue_When BannedUntilIsInTheFuture")
    void shouldReturnTrue_WhenBannedUntilIsInTheFuture() {
        // Arrange
        User user = new User();
        user.setBannedAt(LocalDateTime.now().minusDays(1));
        user.setBannedUntil(LocalDateTime.now().plusDays(1));

        // Act
        boolean result = user.isBanned();

        // Assert
        assertTrue(result, "User should be banned if current time is before bannedUntil");
    }

    @Test
    @DisplayName("should ReturnFalse_When BannedUntilIsInThePast")
    void shouldReturnFalse_WhenBannedUntilIsInThePast() {
        // Arrange
        User user = new User();
        user.setBannedAt(LocalDateTime.now().minusDays(5));
        user.setBannedUntil(LocalDateTime.now().minusDays(1));

        // Act
        boolean result = user.isBanned();

        // Assert
        assertFalse(result, "User should not be banned if bannedUntil has already passed");
    }

    @Test
    @DisplayName("should CoverAllLombokGeneratedMethods_When UsingGettersSettersAndConstructors")
    void shouldCoverAllLombokGeneratedMethods_WhenUsingGettersSettersAndConstructors() {
        // Arrange
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        
        // Act (AllArgsConstructor)
        User userAllArgs = new User(
                id, "nickname", "email@test.com", "hash", "John", "Doe", "Smith",
                "123456789", "http://pic", UserRole.USER, now, now, now, 1, now, "reason",
                "reactivation-token-uuid", now
        );

        // Act (NoArgsConstructor & Setters)
        User user = new User();
        user.setId(id);
        user.setNickname("nickname");
        user.setEmail("email@test.com");
        user.setPasswordHash("hash");
        user.setFirstName("John");
        user.setLastName1("Doe");
        user.setLastName2("Smith");
        user.setPhone("123456789");
        user.setProfilePicUrl("http://pic");
        user.setRole(UserRole.USER);
        user.setDeletedAt(now);
        user.setBannedAt(now);
        user.setCreatedAt(now);
        user.setTokenVersion(1);
        user.setBannedUntil(now);
        user.setBanReason("reason");
        user.setReactivationToken("reactivation-token-uuid");
        user.setReactivationTokenExpiresAt(now);

        // Assert (Getters)
        assertAll("Verify getters and setters",
                () -> assertEquals(id, user.getId()),
                () -> assertEquals("nickname", user.getNickname()),
                () -> assertEquals("email@test.com", user.getEmail()),
                () -> assertEquals("hash", user.getPasswordHash()),
                () -> assertEquals("John", user.getFirstName()),
                () -> assertEquals("Doe", user.getLastName1()),
                () -> assertEquals("Smith", user.getLastName2()),
                () -> assertEquals("123456789", user.getPhone()),
                () -> assertEquals("http://pic", user.getProfilePicUrl()),
                () -> assertEquals(UserRole.USER, user.getRole()),
                () -> assertEquals(now, user.getDeletedAt()),
                () -> assertEquals(now, user.getBannedAt()),
                () -> assertEquals(now, user.getCreatedAt()),
                () -> assertEquals(1, user.getTokenVersion()),
                () -> assertEquals(now, user.getBannedUntil()),
                () -> assertEquals("reason", user.getBanReason()),
                () -> assertEquals("reactivation-token-uuid", user.getReactivationToken()),
                () -> assertEquals(now, user.getReactivationTokenExpiresAt())
        );

        // Assert matching between constructors
        assertEquals(userAllArgs.getId(), user.getId());
    }

    @Test
    @DisplayName("should CoverSettersAndGetters_When UsingLombok")
    void shouldCoverSettersAndGetters_WhenUsingLombok() {
        UUID id1 = UUID.randomUUID();
        User user1 = new User();
        user1.setId(id1);
        user1.setEmail("test@test.com");
        
        assertEquals(id1, user1.getId());
        assertEquals("test@test.com", user1.getEmail());
    }

    @Test
    @DisplayName("should CoverAllBranchesInGetFullName")
    void shouldCoverAllBranchesInGetFullName() {
        User user = new User();
        user.setFirstName("John");
        
        // lastName1 is null
        user.setLastName1(null);
        assertEquals("John", user.getFullName());
        
        // lastName1 is blank
        user.setLastName1("  ");
        assertEquals("John", user.getFullName());
        
        // lastName1 exists, lastName2 is null
        user.setLastName1("Doe");
        user.setLastName2(null);
        assertEquals("John Doe", user.getFullName());
        
        // lastName1 exists, lastName2 is blank
        user.setLastName2("");
        assertEquals("John Doe", user.getFullName());
        
        // Both exist
        user.setLastName2("Smith");
        assertEquals("John Doe Smith", user.getFullName());
    }
}
