package com.vvu981.colivibackend.core.security;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserPrincipalTest {

    @Test
    @DisplayName("Debe crear UserPrincipal a partir de entidad User y exponer propiedades de UserDetails")
    void testUserPrincipalMethods() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("principal@colivi.com");
        user.setPasswordHash("hashed-pass");
        user.setRole(UserRole.USER);

        UserPrincipal principal = UserPrincipal.create(user);

        assertEquals(userId, principal.getId());
        assertEquals("principal@colivi.com", principal.getUsername());
        assertEquals("hashed-pass", principal.getPassword());
        assertTrue(principal.isAccountNonExpired());
        assertTrue(principal.isAccountNonLocked());
        assertTrue(principal.isCredentialsNonExpired());
        assertTrue(principal.isEnabled());
        assertEquals(1, principal.getAuthorities().size());
        assertEquals("USER", principal.getAuthorities().iterator().next().getAuthority());
    }
}
