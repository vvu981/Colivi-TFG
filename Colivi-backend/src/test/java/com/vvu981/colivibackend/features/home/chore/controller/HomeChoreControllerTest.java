package com.vvu981.colivibackend.features.home.chore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
import com.vvu981.colivibackend.features.home.chore.dto.*;
import com.vvu981.colivibackend.features.home.chore.service.ChoreService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class HomeChoreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChoreService choreService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private User authUser;
    private UUID homeId;
    private UsernamePasswordAuthenticationToken auth;

    @BeforeEach
    void setUp() {
        authUser = new User();
        authUser.setId(UUID.randomUUID());
        authUser.setEmail("carlos@colivi.es");
        authUser.setNickname("carlos");

        homeId = UUID.randomUUID();

        auth = new UsernamePasswordAuthenticationToken(authUser, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("POST /api/v1/homes/{homeId}/chores -> 201 Created")
    void createChoreEndpoint() throws Exception {
        CreateChoreRequest request = new CreateChoreRequest(
                "Fregar platos",
                "Turno de noche",
                authUser.getId(),
                10,
                LocalDate.now().plusDays(1),
                RecurrenceType.NONE,
                1
        );

        ChoreResponseDto responseDto = new ChoreResponseDto(
                UUID.randomUUID(),
                UUID.randomUUID(),
                homeId,
                "Fregar platos",
                "Turno de noche",
                authUser.getId(),
                "Carlos",
                null,
                "#4F46E5",
                null,
                null,
                null,
                10,
                LocalDate.now().plusDays(1),
                ChoreStatus.PENDING,
                null,
                LocalDateTime.now(),
                false,
                false,
                true
        );

        when(choreService.createChore(eq(homeId), any(CreateChoreRequest.class), eq(authUser.getId())))
                .thenReturn(List.of(responseDto));

        mockMvc.perform(post("/api/v1/homes/{homeId}/chores", homeId)
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].title").value("Fregar platos"))
                .andExpect(jsonPath("$[0].basePoints").value(10))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].assigneeColor").value("#4F46E5"));
    }

    @Test
    @DisplayName("GET /api/v1/homes/{homeId}/chores -> 200 OK")
    void getChoresEndpoint() throws Exception {
        ChoreResponseDto responseDto = new ChoreResponseDto(
                UUID.randomUUID(),
                null,
                homeId,
                "Limpiar cristales",
                null,
                authUser.getId(),
                "Carlos",
                null,
                "#4F46E5",
                null,
                null,
                null,
                20,
                LocalDate.now(),
                ChoreStatus.PENDING,
                null,
                LocalDateTime.now(),
                false,
                false,
                true
        );

        when(choreService.getChores(eq(homeId), any(ChoreFilterDto.class), eq(authUser.getId())))
                .thenReturn(List.of(responseDto));

        mockMvc.perform(get("/api/v1/homes/{homeId}/chores", homeId)
                        .principal(auth)
                        .param("period", "WEEK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Limpiar cristales"))
                .andExpect(jsonPath("$[0].basePoints").value(20));
    }

    @Test
    @DisplayName("PATCH /api/v1/homes/{homeId}/chores/{choreId}/complete -> 200 OK")
    void completeChoreEndpoint() throws Exception {
        UUID choreId = UUID.randomUUID();
        ChoreResponseDto responseDto = new ChoreResponseDto(
                choreId,
                null,
                homeId,
                "Barrer cocina",
                null,
                authUser.getId(),
                "Carlos",
                null,
                "#4F46E5",
                authUser.getId(),
                "Carlos",
                null,
                15,
                LocalDate.now(),
                ChoreStatus.COMPLETED,
                LocalDateTime.now(),
                LocalDateTime.now(),
                false,
                false,
                false
        );

        when(choreService.completeChore(eq(homeId), eq(choreId), eq(authUser.getId())))
                .thenReturn(responseDto);

        mockMvc.perform(patch("/api/v1/homes/{homeId}/chores/{choreId}/complete", homeId, choreId)
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedByName").value("Carlos"));
    }

    @Test
    @DisplayName("DELETE /api/v1/homes/{homeId}/chores/{choreId}?mode=DELETE_FORWARD -> 204 No Content")
    void deleteChoreEndpoint() throws Exception {
        UUID choreId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/homes/{homeId}/chores/{choreId}", homeId, choreId)
                        .principal(auth)
                        .param("mode", "DELETE_FORWARD"))
                .andExpect(status().isNoContent());

        verify(choreService).deleteChore(eq(homeId), eq(choreId), eq(DeleteMode.DELETE_FORWARD), eq(authUser.getId()));
    }

    @Test
    @DisplayName("GET /api/v1/homes/{homeId}/chores/leaderboard -> 200 OK")
    void getLeaderboardEndpoint() throws Exception {
        UserChoreScoreDto score = new UserChoreScoreDto(
                authUser.getId(),
                "carlos",
                "Carlos Gómez",
                null,
                45,
                65,
                3,
                1,
                0,
                2
        );

        ChoreLeaderboardDto leaderboardDto = new ChoreLeaderboardDto(
                "WEEKLY",
                LocalDate.now().minusDays(3),
                LocalDate.now().plusDays(3),
                List.of(score)
        );

        when(choreService.getLeaderboard(eq(homeId), eq("WEEKLY"), eq(authUser.getId())))
                .thenReturn(leaderboardDto);

        mockMvc.perform(get("/api/v1/homes/{homeId}/chores/leaderboard", homeId)
                        .principal(auth)
                        .param("period", "WEEKLY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("WEEKLY"))
                .andExpect(jsonPath("$.scores[0].currentPoints").value(45))
                .andExpect(jsonPath("$.scores[0].expectedPoints").value(65));
    }
}
