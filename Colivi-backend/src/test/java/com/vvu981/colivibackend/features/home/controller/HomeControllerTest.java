package com.vvu981.colivibackend.features.home.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtAuthenticationFilter;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;
import com.vvu981.colivibackend.features.home.dto.CreateHomeRequest;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;
import com.vvu981.colivibackend.features.home.dto.JoinHomeRequest;
import com.vvu981.colivibackend.features.home.service.HomeCommandService;
import com.vvu981.colivibackend.features.home.service.HomeQueryService;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = HomeController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}
        )
)
@AutoConfigureMockMvc(addFilters = false)
class HomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HomeQueryService homeQueryService;

    @MockBean
    private HomeCommandService homeCommandService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private UUID userId;
    private UUID homeId;
    private UserPrincipal principal;
    private UserPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        homeId = UUID.randomUUID();
        principal = new UserPrincipal(userId, "test@test.com", "pass", List.of(new SimpleGrantedAuthority("USER")));
        adminPrincipal = new UserPrincipal(userId, "admin@test.com", "pass", List.of(new SimpleGrantedAuthority("ADMIN")));
    }

    @Test
    void createHome() throws Exception {
        CreateHomeRequest request = new CreateHomeRequest("My Home");
        HomeDetailResponseDto response = new HomeDetailResponseDto(
                homeId, "My Home", "CODE", HomeRole.ADMIN, HomeMemberStatus.ACTIVE, 1, LocalDateTime.now(), List.of()
        );

        when(homeCommandService.createHome(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/homes")
                        .with(user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(homeId.toString()))
                .andExpect(jsonPath("$.name").value("My Home"));
    }

    @Test
    void joinHome() throws Exception {
        JoinHomeRequest request = new JoinHomeRequest("CODE1234");
        HomeDetailResponseDto response = new HomeDetailResponseDto(
                homeId, "My Home", "CODE1234", HomeRole.MEMBER, HomeMemberStatus.ACTIVE, 1, LocalDateTime.now(), List.of()
        );

        when(homeCommandService.joinHome(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/homes/join")
                        .with(user(principal))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Home"));
    }

    @Test
    void getUserHomes() throws Exception {
        HomeResponseDto response = new HomeResponseDto(
                homeId, "My Home", "CODE1234", HomeRole.MEMBER, HomeMemberStatus.ACTIVE, 1, LocalDateTime.now()
        );

        when(homeQueryService.getUserHomes(any(), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/homes")
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("My Home"));
    }

    @Test
    void getHomeDetail() throws Exception {
        HomeDetailResponseDto response = new HomeDetailResponseDto(
                homeId, "My Home", "CODE", HomeRole.MEMBER, HomeMemberStatus.ACTIVE, 1, LocalDateTime.now(), List.of()
        );

        when(homeQueryService.getHomeDetail(any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/homes/{id}", homeId)
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Home"));
    }

    @Test
    void leaveHome() throws Exception {
        mockMvc.perform(patch("/api/v1/homes/{id}/leave", homeId)
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(homeCommandService).leaveHome(eq(homeId), any());
    }

    @Test
    void archiveHomeView() throws Exception {
        mockMvc.perform(patch("/api/v1/homes/{id}/archive", homeId)
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(homeCommandService).archiveHomeView(eq(homeId), any());
    }

    @Test
    void unarchiveHomeView() throws Exception {
        mockMvc.perform(patch("/api/v1/homes/{id}/unarchive", homeId)
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(homeCommandService).unarchiveHomeView(eq(homeId), any());
    }

    @Test
    void transferAdmin() throws Exception {
        UUID targetId = UUID.randomUUID();
        mockMvc.perform(patch("/api/v1/homes/{id}/transfer-admin", homeId)
                        .with(user(principal))
                        .param("targetUserId", targetId.toString())
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(homeCommandService).transferAdmin(eq(homeId), any(), eq(targetId));
    }

    @Test
    void expelMember() throws Exception {
        UUID targetId = UUID.randomUUID();
        mockMvc.perform(patch("/api/v1/homes/{id}/members/{targetUserId}/expel", homeId, targetId)
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(homeCommandService).expelMember(eq(homeId), any(), eq(targetId));
    }

    @Test
    void softDeleteHome() throws Exception {
        mockMvc.perform(delete("/api/v1/homes/{id}", homeId)
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(homeCommandService).softDeleteHome(eq(homeId), any());
    }

    @Test
    void hardDeleteHome() throws Exception {
        mockMvc.perform(delete("/api/v1/homes/{id}/hard", homeId)
                        .with(user(adminPrincipal))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(homeCommandService).hardDeleteHome(eq(homeId), any());
    }
}
