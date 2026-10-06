package com.vvu981.colivibackend.features.home.controller;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.dto.ActivityLogResponseDto;
import com.vvu981.colivibackend.features.home.service.ActivityLogQueryService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
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

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class HomeActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ActivityLogQueryService activityLogQueryService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private User authUser;
    private UUID homeId;
    private UsernamePasswordAuthenticationToken authentication;

    @BeforeEach
    void setUp() {
        authUser = new User();
        authUser.setId(UUID.randomUUID());
        authUser.setEmail("test@test.com");

        authentication = new UsernamePasswordAuthenticationToken(authUser, null, java.util.List.of());
        homeId = UUID.randomUUID();
    }

    @Test
    void getHomeActivities() throws Exception {
        ActivityLogResponseDto dto = new ActivityLogResponseDto(
                UUID.randomUUID(), homeId, authUser.getId(), "Test User", ActivityType.HOME_CREATED, "desc", null,
                LocalDateTime.now());
        Page<ActivityLogResponseDto> page = new PageImpl<>(List.of(dto));

        when(activityLogQueryService.getHomeActivities(any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/homes/{homeId}/activities", homeId)
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].actorFullName").value("Test User"))
                .andExpect(jsonPath("$.content[0].activityType").value("HOME_CREATED"));
    }
}
