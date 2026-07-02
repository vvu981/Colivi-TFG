package com.vvu981.colivibackend.features.accommodation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationListingService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccommodationListingController.class)
@Import(SecurityConfig.class)
@DisplayName("AccommodationListingController")
class AccommodationListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AccommodationListingService listingService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private User hostUser;
    private User adminUser;
    private AccommodationListingResponse listingResponse;
    private UUID listingId;
    private UUID accommodationId;

    @BeforeEach
    void setUp() {
        listingId = UUID.randomUUID();
        accommodationId = UUID.randomUUID();

        hostUser = new User();
        hostUser.setId(UUID.randomUUID());
        hostUser.setEmail("host@colivi.com");
        hostUser.setNickname("hosty");
        hostUser.setRole(UserRole.USER);

        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setEmail("admin@colivi.com");
        adminUser.setNickname("adminy");
        adminUser.setRole(UserRole.ADMIN);

        listingResponse = new AccommodationListingResponse(
                listingId,
                "Cozy Room in Center",
                "Nice and warm room in city center",
                BigDecimal.valueOf(450.0),
                ListingStatus.AVAILABLE,
                LocalDateTime.now(),
                null,
                hostUser.getId(),
                hostUser.getNickname());
    }

    private UsernamePasswordAuthenticationToken buildAuth(User user) {
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());
        return new UsernamePasswordAuthenticationToken(user, null, Collections.singletonList(authority));
    }

    @Nested
    @DisplayName("GET /api/v1/listings")
    class GetPublicCatalog {

        @Test
        @DisplayName("debe retornar 200 con catalogo paginado")
        @WithMockUser
        void shouldReturnPublicCatalog() throws Exception {
            Page<AccommodationListingResponse> page = new PageImpl<>(List.of(listingResponse));
            when(listingService.searchListings(any(), anyInt(), anyInt())).thenReturn(page);

            mockMvc.perform(get("/api/v1/listings")
                    .param("page", "0")
                    .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content[0].title").value("Cozy Room in Center"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/listings/{id}")
    class GetListing {

        @Test
        @DisplayName("debe retornar 200 con el anuncio solicitado")
        @WithMockUser
        void shouldReturnListing() throws Exception {
            when(listingService.getAccommodationListing(listingId)).thenReturn(listingResponse);

            mockMvc.perform(get("/api/v1/listings/{id}", listingId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Cozy Room in Center"));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/listings")
    class CreateListing {

        @Test
        @DisplayName("debe crear el anuncio y retornar 200 cuando esta autenticado")
        void shouldCreateListing() throws Exception {
            AccommodationListingRequest request = new AccommodationListingRequest(
                    accommodationId, "Cozy Room in Center", "Nice and warm room in city center",
                    BigDecimal.valueOf(450.0));
            when(listingService.createAccommodationListing(any(AccommodationListingRequest.class), any(User.class)))
                    .thenReturn(listingResponse);

            mockMvc.perform(post("/api/v1/listings")
                    .with(csrf())
                    .with(authentication(buildAuth(hostUser)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Cozy Room in Center"));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/listings/{id}")
    class UpdateListing {

        @Test
        @DisplayName("debe actualizar el anuncio si es el propietario")
        void shouldUpdateListing() throws Exception {
            AccommodationListingUpdateRequest request = new AccommodationListingUpdateRequest(
                    "Updated Title", "Updated Description", BigDecimal.valueOf(500.0));
            AccommodationListingResponse updatedResponse = new AccommodationListingResponse(
                    listingId,
                    "Updated Title",
                    "Updated Description",
                    BigDecimal.valueOf(500.0),
                    ListingStatus.AVAILABLE,
                    LocalDateTime.now(),
                    null,
                    hostUser.getId(),
                    hostUser.getNickname());
            when(listingService.updateAccommodationListing(eq(listingId), any(AccommodationListingUpdateRequest.class),
                    any(User.class)))
                    .thenReturn(updatedResponse);

            mockMvc.perform(put("/api/v1/listings/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(hostUser)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Updated Title"));
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/listings/ban/{id}")
    class BanListing {

        @Test
        @DisplayName("debe banear el anuncio si es admin")
        @WithMockUser(authorities = "ADMIN")
        void shouldBanListing() throws Exception {
            doNothing().when(listingService).banAccommodationListing(eq(listingId), any(User.class));

            mockMvc.perform(patch("/api/v1/listings/ban/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(adminUser))))
                    .andExpect(status().isNoContent());

            verify(listingService, times(1)).banAccommodationListing(eq(listingId), any(User.class));
        }

        @Test
        @DisplayName("debe retornar 403 si intenta banear y no es admin")
        void shouldDenyBanIfNotAdmin() throws Exception {
            mockMvc.perform(patch("/api/v1/listings/ban/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(hostUser))))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/listings/unban/{id}")
    class UnbanListing {

        @Test
        @DisplayName("debe desbanear el anuncio si es admin")
        @WithMockUser(authorities = "ADMIN")
        void shouldUnbanListing() throws Exception {
            doNothing().when(listingService).unBanAccommodationListing(eq(listingId), any(User.class));

            mockMvc.perform(patch("/api/v1/listings/unban/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(adminUser))))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("debe retornar 403 si intenta desbanear y no es admin")
        void shouldDenyUnbanIfNotAdmin() throws Exception {
            mockMvc.perform(patch("/api/v1/listings/unban/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(hostUser))))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/listings/softDelete/{id}")
    class SoftDeleteListing {

        @Test
        @DisplayName("debe marcar como borrado (soft delete)")
        void shouldSoftDeleteListing() throws Exception {
            doNothing().when(listingService).deleteAccommodationListingSoft(eq(listingId), any(User.class));

            mockMvc.perform(patch("/api/v1/listings/softDelete/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(hostUser))))
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/listings/hardDelete/{id}")
    class HardDeleteListing {

        @Test
        @DisplayName("debe eliminar el anuncio físicamente si es admin")
        @WithMockUser(authorities = "ADMIN")
        void shouldHardDeleteListing() throws Exception {
            doNothing().when(listingService).deleteAccommodationListingHard(eq(listingId), any(User.class));

            mockMvc.perform(delete("/api/v1/listings/hardDelete/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(adminUser))))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("debe retornar 403 si intenta hard delete y no es admin")
        void shouldDenyHardDeleteIfNotAdmin() throws Exception {
            mockMvc.perform(delete("/api/v1/listings/hardDelete/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(hostUser))))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/listings/recover/{id}")
    class RecoverListing {

        @Test
        @DisplayName("debe recuperar el anuncio si es admin")
        @WithMockUser(authorities = "ADMIN")
        void shouldRecoverListing() throws Exception {
            when(listingService.recoverAccommodationListing(eq(listingId), any(User.class)))
                    .thenReturn(listingResponse);

            mockMvc.perform(patch("/api/v1/listings/recover/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(adminUser))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Cozy Room in Center"));
        }

        @Test
        @DisplayName("debe retornar 403 si intenta recuperar y no es admin")
        void shouldDenyRecoverIfNotAdmin() throws Exception {
            mockMvc.perform(patch("/api/v1/listings/recover/{id}", listingId)
                    .with(csrf())
                    .with(authentication(buildAuth(hostUser))))
                    .andExpect(status().isForbidden());
        }
    }
}
