package com.vvu981.colivibackend.features.accommodation.controller;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationListingService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminListingController.class)
@Import(SecurityConfig.class)
@DisplayName("AdminListingController")
class AdminListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccommodationListingService listingService;

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
    @DisplayName("Debe retornar listado para ADMIN")
    void shouldReturnListingsForAdmin() throws Exception {
        Page<AccommodationListingResponse> page = new PageImpl<>(List.of());
        when(listingService.searchAllListingsForAdmin(any(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/listings")
                .with(authentication(buildAuth(adminUser)))
                .param("page", "0")
                .param("size", "10")
                .param("hostId", UUID.randomUUID().toString())
                .param("status", "AVAILABLE")
                .param("sortBy", "createdAt")
                .param("sortDirection", "DESC"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Debe fallar para USER")
    void shouldFailForUser() throws Exception {
        mockMvc.perform(get("/api/v1/admin/listings")
                .with(authentication(buildAuth(regularUser)))
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Debe fallar para anónimo")
    void shouldFailForAnonymous() throws Exception {
        mockMvc.perform(get("/api/v1/admin/listings")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isForbidden());
    }
}
