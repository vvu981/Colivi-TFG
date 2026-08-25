package com.vvu981.colivibackend.features.recommendation.controller;

import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.recommendation.service.RecommendationService;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.context.annotation.Import;
import com.vvu981.colivibackend.core.security.SecurityConfig;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.user.repository.UserRepository;

@WebMvcTest(RecommendationController.class)
@Import(SecurityConfig.class)
class RecommendationControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private JwtTokenProvider jwtTokenProvider;

        @MockBean
        private UserRepository userRepository;

        @MockBean
        private RecommendationService recommendationService;

        private AccommodationListingResponse responseDto;
        private User testUser;

        @BeforeEach
        void setUp() {
                testUser = new User();
                testUser.setId(UUID.randomUUID());
                testUser.setRole(com.vvu981.colivibackend.features.user.domain.UserRole.USER);

                responseDto = new AccommodationListingResponse(
                                UUID.randomUUID(),
                                "Title",
                                "Description",
                                new BigDecimal("500"),
                                new BigDecimal("500"),
                                ListingStatus.AVAILABLE,
                                "ROOM",
                                java.time.LocalDateTime.now(),
                                null,
                                null,
                                null,
                                null,
                                true, null);
        }

        @Test
        void testGetRecommendations_Anonymous() throws Exception {
                when(recommendationService.getRecommendations(any(), anyInt(), any(), any(), any(), any(), any()))
                                .thenReturn(List.of(responseDto));

                mockMvc.perform(get("/api/v1/listings/recommendations")
                                .param("limit", "6")
                                .param("city", "Madrid")
                                .param("minPrice", "200")
                                .param("maxPrice", "1000")
                                .param("rentalType", "ROOM"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].title").value("Title"));
        }

        @Test
        void testGetRecommendations_Authenticated() throws Exception {
                when(recommendationService.getRecommendations(any(), anyInt(), any(), any(), any(), any(), any()))
                                .thenReturn(List.of(responseDto));

                mockMvc.perform(get("/api/v1/listings/recommendations")
                                .with(authentication(new UsernamePasswordAuthenticationToken(
                                                UserPrincipal.create(testUser), null,
                                                java.util.Collections.emptyList()))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].title").value("Title"));
        }
}
