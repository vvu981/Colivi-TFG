package com.vvu981.colivibackend.features.accommodation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationImageOrderRequest;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
        private User adminUser;
        private AccommodationRequest request;
        private Accommodation accommodation;

        @BeforeEach
        void setUp() {
                testUser = new User();
                testUser.setId(UUID.randomUUID());
                testUser.setEmail("test@colivi.com");
                testUser.setRole(UserRole.USER);

                adminUser = new User();
                adminUser.setId(UUID.randomUUID());
                adminUser.setEmail("admin@colivi.com");
                adminUser.setRole(UserRole.ADMIN);

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

        private UsernamePasswordAuthenticationToken buildAuth(User user) {
                UserPrincipal principal = UserPrincipal.create(user);
                return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        }

        @Nested
        @DisplayName("GET /api/v1/accommodation")
        class GetCatalog {

                @Test
                @DisplayName("debe retornar 200 con el catálogo paginado")
                void shouldReturnOkAndCatalog() throws Exception {
                        Page<AccommodationResponse> pageResult = new PageImpl<>(
                                        Collections.singletonList(
                                                        new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                                                        accommodation)));

                        when(accommodationService.getMyAccommodations(
                                        any(),
                                        any(AccommodationVisibility.class),
                                        anyInt(),
                                        anyInt(),
                                        any())).thenReturn(pageResult);

                        mockMvc.perform(get("/api/v1/accommodation/me")
                                        .with(authentication(buildAuth(testUser)))
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
                void shouldReturnOkWithoutOwnerId() throws Exception {
                        Page<com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse> pageResult = new PageImpl<>(
                                        Collections.emptyList());

                        when(accommodationService.getMyAccommodations(
                                        any(),
                                        any(AccommodationVisibility.class),
                                        anyInt(),
                                        anyInt(),
                                        any())).thenReturn(pageResult);

                        mockMvc.perform(get("/api/v1/accommodation/me")
                                        .with(authentication(buildAuth(testUser)))
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
                void shouldCreateAccommodationAndReturn201() throws Exception {
                        when(accommodationService.createAccommodation(any(AccommodationRequest.class), any()))
                                        .thenReturn(new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                                        accommodation));

                        mockMvc.perform(post("/api/v1/accommodation")
                                        .with(csrf())
                                        .with(authentication(buildAuth(testUser)))
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

        @Nested
        @DisplayName("POST /api/v1/accommodation/{id}/images")
        class UploadImage {

                @Test
                @DisplayName("debe subir una imagen correctamente si está autenticado")
                void shouldUploadImageSuccessfully() throws Exception {
                        org.springframework.mock.web.MockMultipartFile mockFile = new org.springframework.mock.web.MockMultipartFile(
                                        "file", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "image content".getBytes());

                        when(accommodationService.addImageToAccommodation(eq(accommodation.getId()), any(), any()))
                                        .thenReturn(new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                                        accommodation));

                        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                        .multipart("/api/v1/accommodation/{id}/images", accommodation.getId())
                                        .file(mockFile)
                                        .with(csrf())
                                        .with(authentication(buildAuth(testUser))))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.address").value("Calle Gran Via 12"));
                }

                @Test
                @DisplayName("debe retornar 403 si no hay autenticación al subir imagen")
                void shouldReturn403WhenUnauthenticated() throws Exception {
                        org.springframework.mock.web.MockMultipartFile mockFile = new org.springframework.mock.web.MockMultipartFile(
                                        "file", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "image content".getBytes());

                        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                        .multipart("/api/v1/accommodation/{id}/images", accommodation.getId())
                                        .file(mockFile)
                                        .with(csrf()))
                                        .andExpect(status().isForbidden());
                }
        }

        @Nested
        @DisplayName("PUT /api/v1/accommodation/{id}")
        class UpdateAccommodation {
                @Test
                @DisplayName("debe actualizar el alojamiento si está autenticado")
                void shouldUpdateSuccessfully() throws Exception {
                        when(accommodationService.updateAccommodation(eq(accommodation.getId()), any(), any()))
                                        .thenReturn(new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                                        accommodation));

                        mockMvc.perform(put("/api/v1/accommodation/{id}", accommodation.getId())
                                        .with(csrf())
                                        .with(authentication(buildAuth(testUser)))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.address").value("Calle Gran Via 12"));
                }
        }

        @Nested
        @DisplayName("PATCH /api/v1/accommodation/delete/{id}")
        class DeleteSoft {
                @Test
                @DisplayName("debe borrar lógicamente si está autenticado")
                void shouldSoftDeleteSuccessfully() throws Exception {
                        when(accommodationService.deleteAccommodationSoft(eq(accommodation.getId()), any()))
                                        .thenReturn(new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                                        accommodation));

                        mockMvc.perform(patch("/api/v1/accommodation/delete/{id}", accommodation.getId())
                                        .with(authentication(buildAuth(testUser)))
                                        .with(csrf()))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.address").value("Calle Gran Via 12"));
                }
        }

        @Nested
        @DisplayName("DELETE /api/v1/accommodation/hardDelete/{id}")
        class DeleteHard {
                @Test
                @DisplayName("debe borrar físicamente si está autenticado")
                void shouldHardDeleteSuccessfully() throws Exception {
                        mockMvc.perform(delete("/api/v1/accommodation/hardDelete/{id}", accommodation.getId())
                                        .with(authentication(buildAuth(adminUser)))
                                        .with(csrf()))
                                        .andExpect(status().isNoContent());
                }
        }

        @Nested
        @DisplayName("GET /api/v1/accommodation/{id}")
        class GetAccommodationDetails {
                @Test
                @DisplayName("debe retornar los detalles del alojamiento")
                void shouldGetSuccessfully() throws Exception {
                        when(accommodationService.getAccommodation(eq(accommodation.getId())))
                                        .thenReturn(new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                                        accommodation));

                        mockMvc.perform(get("/api/v1/accommodation/{id}", accommodation.getId())
                                        .with(authentication(buildAuth(testUser))))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.address").value("Calle Gran Via 12"));
                }
        }

        @Nested
        @DisplayName("DELETE /api/v1/accommodation/{id}/images/{imageId}")
        class DeleteImage {
                @Test
                @DisplayName("debe borrar la imagen correctamente si está autenticado")
                void shouldDeleteImageSuccessfully() throws Exception {
                        UUID imageId = UUID.randomUUID();
                        doNothing().when(accommodationService).removeImageFromAccommodation(eq(accommodation.getId()),
                                        eq(imageId), any());

                        mockMvc.perform(delete("/api/v1/accommodation/{id}/images/{imageId}", accommodation.getId(),
                                        imageId)
                                        .with(authentication(buildAuth(testUser)))
                                        .with(csrf()))
                                        .andExpect(status().isNoContent());

                        verify(accommodationService, times(1)).removeImageFromAccommodation(eq(accommodation.getId()),
                                        eq(imageId), any());
                }
        }

        @Nested
        @DisplayName("PUT /api/v1/accommodation/{id}/images/order")
        class ReorderImages {
                @Test
                @DisplayName("debe reordenar las imágenes correctamente si está autenticado")
                void shouldReorderImagesSuccessfully() throws Exception {
                        List<AccommodationImageOrderRequest> orderRequests = List.of(
                                        new AccommodationImageOrderRequest(UUID.randomUUID(), 1));
                        when(accommodationService.updateImagesOrder(eq(accommodation.getId()), anyList(), any()))
                                        .thenReturn(new com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse(
                                                        accommodation));

                        mockMvc.perform(put("/api/v1/accommodation/{id}/images/order", accommodation.getId())
                                        .with(authentication(buildAuth(testUser)))
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(orderRequests)))
                                        .andExpect(status().isOk());
                }
        }
}
