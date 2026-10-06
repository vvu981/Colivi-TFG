package com.vvu981.colivibackend.features.user.controller;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.AdminUserProfileResponse;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.features.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminUserController.class)
@Import(SecurityConfig.class)
@DisplayName("AdminUserController")
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setEmail("admin@colivi.com");
        adminUser.setRole(UserRole.ADMIN);

        regularUser = new User();
        regularUser.setId(UUID.randomUUID());
        regularUser.setEmail("user@colivi.com");
        regularUser.setRole(UserRole.USER);
    }

    private UsernamePasswordAuthenticationToken buildAuth(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @DisplayName("GET /api/v1/admin/users retorna 200 con listado paginado para ADMIN")
    void shouldReturnUsersForAdmin() throws Exception {
        AdminUserProfileResponse userDto = new AdminUserProfileResponse(
                UUID.randomUUID(),
                "test@colivi.com",
                "+34123456789",
                UserRole.USER,
                "testuser",
                "Test",
                "User",
                null,
                null,
                LocalDateTime.now(),
                null,
                null,
                null,
                null);
        Page<AdminUserProfileResponse> page = new PageImpl<>(List.of(userDto));
        when(userService.searchUsersForAdmin(any(), any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users")
                .with(authentication(buildAuth(adminUser)))
                .param("query", "test")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("test@colivi.com"))
                .andExpect(jsonPath("$.content[0].nickname").value("testuser"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/users retorna 403 para usuario con rol USER")
    void shouldReturnForbiddenForRegularUser() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .with(authentication(buildAuth(regularUser))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/admin/users retorna 403 para usuario no autenticado")
    void shouldReturnForbiddenForAnonymous() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());
    }
}
