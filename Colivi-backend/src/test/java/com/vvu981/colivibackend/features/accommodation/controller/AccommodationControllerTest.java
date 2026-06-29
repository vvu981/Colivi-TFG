package com.vvu981.colivibackend.features.accommodation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AccommodationController.class)
@Import(SecurityConfig.class)
@DisplayName("AccommodationController")
class AccommodationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccommodationService accommodationService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private AccommodationRequest request;
    private Accommodation accommodation;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@colivi.com");
        testUser.setRole(UserRole.USER);

        request = new AccommodationRequest(
                "Calle Gran Via 12",
                5,
                2,
                1,
                110,
                "Madrid",
                "Spain",
                "Madrid",
                40.4167,
                -3.7037,
                Set.of(AmenityType.WIFI));

        accommodation = new Accommodation(request, testUser);
        accommodation.setId(UUID.randomUUID());
    }

    @Nested
    @DisplayName("GET /api/v1/accommodation")
    class GetCatalog {

        @Test
        @DisplayName("debe retornar 200 con el catálogo paginado")
        @WithMockUser
        void shouldReturnOkAndCatalog() throws Exception {
            Page<AccommodationResponse> pageResult = new PageImpl<>(
                    Collections.singletonList(
                            new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                    accommodation)));

            when(accommodationService.getAccommodationsCatalog(
                    any(),
                    any(AccommodationVisibility.class),
                    anyInt(),
                    anyInt())).thenReturn(pageResult);

            mockMvc.perform(get("/api/v1/accommodation")
                    .param("ownerId", UUID.randomUUID().toString())
                    .param("visibility", "AVAILABLE")
                    .param("page", "0")
                    .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content[0].address").value("Calle Gran Via 12"));
        }

        @Test
        @DisplayName("debe retornar 200 sin ownerId (parámetro opcional)")
        @WithMockUser
        void shouldReturnOkWithoutOwnerId() throws Exception {
            Page<com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse> pageResult = new PageImpl<>(
                    Collections.emptyList());

            when(accommodationService.getAccommodationsCatalog(
                    any(),
                    any(AccommodationVisibility.class),
                    anyInt(),
                    anyInt())).thenReturn(pageResult);

            mockMvc.perform(get("/api/v1/accommodation")
                    .param("visibility", "AVAILABLE")
                    .param("page", "0")
                    .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/accommodation")
    class CreateAccommodation {

        @Test
        @DisplayName("debe crear un alojamiento si está autenticado")
        @WithMockUser(username = "test@colivi.com")
        void shouldCreateAccommodationAndReturn201() throws Exception {
            when(accommodationService.createAccommodation(any(AccommodationRequest.class), any()))
                    .thenReturn(new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                            accommodation));

            mockMvc.perform(post("/api/v1/accommodation")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.address").value("Calle Gran Via 12"));
        }

        @Test
        @DisplayName("debe retornar 403 si no hay autenticación")
        void shouldReturn403WhenUnauthenticated() throws Exception {
            mockMvc.perform(post("/api/v1/accommodation")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }
}
