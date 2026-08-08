package com.vvu981.colivibackend.features.home.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;
import com.vvu981.colivibackend.features.home.service.HomeExpenseService;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.user.repository.UserRepository;

import java.math.BigDecimal;
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
class HomeExpenseControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private HomeExpenseService homeExpenseService;

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

                homeId = UUID.randomUUID();

                authentication = new UsernamePasswordAuthenticationToken(
                                authUser, null, java.util.Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        @Test
        void createExpense() throws Exception {
                CreateExpenseRequest request = new CreateExpenseRequest("Pizza", new BigDecimal("20.00"),
                                authUser.getId(),
                                List.of(authUser.getId()));

                ExpenseResponseDto response = new ExpenseResponseDto(UUID.randomUUID(), homeId, "Pizza",
                                new BigDecimal("20.00"), null, null, null);
                when(homeExpenseService.createExpense(eq(homeId), any(), eq(authUser.getId()))).thenReturn(response);

                mockMvc.perform(post("/api/v1/homes/{homeId}/expenses", homeId)
                                .principal(authentication)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.description").value("Pizza"));
        }

        @Test
        void deleteExpense() throws Exception {
                UUID expenseId = UUID.randomUUID();

                mockMvc.perform(delete("/api/v1/homes/{homeId}/expenses/{expenseId}", homeId, expenseId)
                                .principal(authentication))
                                .andExpect(status().isNoContent());

                verify(homeExpenseService).deleteExpense(homeId, expenseId, authUser.getId());
        }

        @Test
        void getHomeExpenses() throws Exception {
                when(homeExpenseService.getHomeExpenses(homeId, authUser.getId())).thenReturn(List.of());

                mockMvc.perform(get("/api/v1/homes/{homeId}/expenses", homeId)
                                .principal(authentication))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray());
        }

        @Test
        void getHomeBalances() throws Exception {
                when(homeExpenseService.getHomeBalances(homeId, authUser.getId())).thenReturn(List.of());

                mockMvc.perform(get("/api/v1/homes/{homeId}/expenses/balances", homeId)
                                .principal(authentication))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray());
        }

        @Test
        void getOptimizedTransfers() throws Exception {
                when(homeExpenseService.getOptimizedTransfers(homeId, authUser.getId())).thenReturn(List.of());

                mockMvc.perform(get("/api/v1/homes/{homeId}/expenses/balances/transfers", homeId)
                                .principal(authentication))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray());
        }
}
