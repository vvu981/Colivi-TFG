package com.vvu981.colivibackend.features.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.*;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.features.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de capa web exhaustivos para UserController usando @WebMvcTest con Security activa.
 */
@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@DisplayName("UserController (@WebMvcTest)")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // --- Dependencias del slice web ---
    @MockBean
    private UserService userService;

    // --- Dependencias del JwtAuthenticationFilter (filtro REAL, no mockeado) ---
    @MockBean
    private JwtTokenProvider jwtTokenProvider;
    @MockBean
    private UserRepository userRepository;

    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        authenticatedUser = new User();
        authenticatedUser.setId(UUID.randomUUID());
        authenticatedUser.setEmail("victor@colivi.com");
        authenticatedUser.setNickname("vvu981");
        authenticatedUser.setFirstName("Víctor");
        authenticatedUser.setLastName1("Vallejo");
        authenticatedUser.setRole(UserRole.USER);
        authenticatedUser.setPasswordHash("$2a$12$hashed");
        authenticatedUser.setTokenVersion(1);
    }

    private UsernamePasswordAuthenticationToken buildAuth(User user) {
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());
        return new UsernamePasswordAuthenticationToken(
                user, null, Collections.singletonList(authority));
    }

    // =========================================================================
    // PATCH /api/v1/users/{userId}/admin
    // =========================================================================

    @Nested
    @DisplayName("PATCH /{userId}/admin — setAdmin")
    class SetAdminEndpoint {

        @Test
        @DisplayName("usuario con rol ADMIN recibe 204 No Content")
        @WithMockUser(authorities = "ADMIN")
        void givenAdminUser_whenSetAdmin_thenReturns204() throws Exception {
            UUID targetId = UUID.randomUUID();
            doNothing().when(userService).setAdmin(any(UUID.class));

            mockMvc.perform(patch("/api/v1/users/{userId}/admin", targetId))
                    .andExpect(status().isNoContent());

            verify(userService).setAdmin(targetId);
        }

        @Test
        @DisplayName("usuario con rol USER recibe 403 Forbidden")
        @WithMockUser(authorities = "USER")
        void givenRegularUser_whenSetAdmin_thenReturns403() throws Exception {
            mockMvc.perform(patch("/api/v1/users/{userId}/admin", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403")
        void givenUnauthenticated_whenSetAdmin_thenReturns403() throws Exception {
            mockMvc.perform(patch("/api/v1/users/{userId}/admin", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // GET /api/v1/users/me
    // =========================================================================

    @Nested
    @DisplayName("GET /me — getMyProfile")
    class GetMyProfileEndpoint {

        @Test
        @DisplayName("usuario autenticado obtiene su perfil y recibe 200 OK con MyProfileResponse")
        void givenAuthenticatedUser_whenGetMyProfile_thenReturns200WithDto() throws Exception {
            MyProfileResponse responseDto = new MyProfileResponse(
                    authenticatedUser.getId(),
                    "victor@colivi.com",
                    "+34612345678",
                    UserRole.USER,
                    "vvu981",
                    "Víctor",
                    "Vallejo",
                    "García",
                    "https://cloudinary.com/avatar.jpg",
                    LocalDateTime.now()
            );

            when(userService.getMyProfile(authenticatedUser.getId())).thenReturn(responseDto);

            mockMvc.perform(get("/api/v1/users/me")
                    .with(authentication(buildAuth(authenticatedUser))))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(authenticatedUser.getId().toString()))
                    .andExpect(jsonPath("$.email").value("victor@colivi.com"))
                    .andExpect(jsonPath("$.nickname").value("vvu981"))
                    .andExpect(jsonPath("$.firstName").value("Víctor"))
                    .andExpect(jsonPath("$.role").value("USER"));

            verify(userService).getMyProfile(authenticatedUser.getId());
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenGetMyProfile_thenReturns403() throws Exception {
            mockMvc.perform(get("/api/v1/users/me"))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // GET /api/v1/users/{userId}
    // =========================================================================

    @Nested
    @DisplayName("GET /{userId} — getUserProfile")
    class GetUserProfileEndpoint {

        @Test
        @DisplayName("obtiene el perfil público de un usuario y recibe 200 OK con UserProfileResponse")
        void givenAuthenticatedUser_whenGetUserProfile_thenReturns200WithDto() throws Exception {
            UUID targetId = UUID.randomUUID();
            UserProfileResponse responseDto = new UserProfileResponse(
                    targetId,
                    "targetNick",
                    "Juan",
                    "Pérez",
                    "López",
                    "https://cloudinary.com/pic.jpg",
                    LocalDateTime.now()
            );

            when(userService.getUserProfile(targetId)).thenReturn(responseDto);

            mockMvc.perform(get("/api/v1/users/{userId}", targetId)
                    .with(authentication(buildAuth(authenticatedUser))))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(targetId.toString()))
                    .andExpect(jsonPath("$.nickname").value("targetNick"))
                    .andExpect(jsonPath("$.firstName").value("Juan"))
                    .andExpect(jsonPath("$.lastName1").value("Pérez"));

            verify(userService).getUserProfile(targetId);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenGetUserProfile_thenReturns403() throws Exception {
            mockMvc.perform(get("/api/v1/users/{userId}", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // GET /api/v1/users/admin/{userId}
    // =========================================================================

    @Nested
    @DisplayName("GET /admin/{userId} — getAdminUserProfile")
    class GetAdminUserProfileEndpoint {

        @Test
        @DisplayName("usuario ADMIN obtiene perfil administrativo completo y recibe 200 OK")
        @WithMockUser(authorities = "ADMIN")
        void givenAdminUser_whenGetAdminUserProfile_thenReturns200WithDto() throws Exception {
            UUID targetId = UUID.randomUUID();
            AdminUserProfileResponse responseDto = new AdminUserProfileResponse(
                    targetId,
                    "admin-view@colivi.com",
                    "+34611111111",
                    UserRole.USER,
                    "targetNick",
                    "Juan",
                    "Pérez",
                    "López",
                    "https://cloudinary.com/pic.jpg",
                    LocalDateTime.now(),
                    null,
                    null,
                    null,
                    null
            );

            when(userService.getAdminUserProfile(targetId)).thenReturn(responseDto);

            mockMvc.perform(get("/api/v1/users/admin/{userId}", targetId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(targetId.toString()))
                    .andExpect(jsonPath("$.email").value("admin-view@colivi.com"))
                    .andExpect(jsonPath("$.role").value("USER"));

            verify(userService).getAdminUserProfile(targetId);
        }

        @Test
        @DisplayName("usuario con rol USER recibe 403 Forbidden")
        @WithMockUser(authorities = "USER")
        void givenRegularUser_whenGetAdminUserProfile_thenReturns403() throws Exception {
            mockMvc.perform(get("/api/v1/users/admin/{userId}", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenGetAdminUserProfile_thenReturns403() throws Exception {
            mockMvc.perform(get("/api/v1/users/admin/{userId}", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/me/profile
    // =========================================================================

    @Nested
    @DisplayName("PATCH /me/profile — updateMyProfile (datos no sensibles)")
    class UpdateProfileEndpoint {

        @Test
        @DisplayName("usuario autenticado recibe 200 con DTO actualizado")
        void givenAuthenticatedUser_whenUpdateProfile_thenReturns200WithDto() throws Exception {
            UpdateNonSensible requestDto = new UpdateNonSensible(
                    "nuevo_nick", "NuevoNombre", "NuevoApellido", null, "+34600000000", null);
            UpdateNonSensible responseDto = new UpdateNonSensible(
                    "nuevo_nick", "NuevoNombre", "NuevoApellido", null, "+34600000000", null);
            when(userService.updateNonSensibleData(any(UUID.class), any(UpdateNonSensible.class)))
                    .thenReturn(responseDto);

            mockMvc.perform(patch("/api/v1/users/me/profile")
                    .with(authentication(buildAuth(authenticatedUser)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.nickname").value("nuevo_nick"))
                    .andExpect(jsonPath("$.firstName").value("NuevoNombre"));

            verify(userService).updateNonSensibleData(eq(authenticatedUser.getId()), any(UpdateNonSensible.class));
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenUpdateProfile_thenReturns403() throws Exception {
            UpdateNonSensible requestDto = new UpdateNonSensible(
                    "nick", "Name", "Last", null, null, null);

            mockMvc.perform(patch("/api/v1/users/me/profile")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/me/credentials
    // =========================================================================

    @Nested
    @DisplayName("PATCH /me/credentials — updateMyCredentials (datos sensibles)")
    class UpdateCredentialsEndpoint {

        @Test
        @DisplayName("usuario autenticado actualiza credenciales y recibe 204 No Content")
        void givenAuthenticatedUser_whenUpdateCredentials_thenReturns204() throws Exception {
            UpdateSensible requestDto = new UpdateSensible("currentPass", "new@email.com", null);
            doNothing().when(userService).updateSensibleData(any(UUID.class), any(UpdateSensible.class));

            mockMvc.perform(patch("/api/v1/users/me/credentials")
                    .with(authentication(buildAuth(authenticatedUser)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isNoContent());

            verify(userService).updateSensibleData(
                    eq(authenticatedUser.getId()),
                    any(UpdateSensible.class));
        }

        @Test
        @DisplayName("petición con currentPassword en blanco devuelve 400 Bad Request por @Valid")
        void givenBlankCurrentPassword_whenUpdateCredentials_thenReturns400() throws Exception {
            UpdateSensible requestDto = new UpdateSensible("", "new@email.com", "newPass");

            mockMvc.perform(patch("/api/v1/users/me/credentials")
                    .with(authentication(buildAuth(authenticatedUser)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenUpdateCredentials_thenReturns403() throws Exception {
            UpdateSensible requestDto = new UpdateSensible("currentPass", null, "newPass");

            mockMvc.perform(patch("/api/v1/users/me/credentials")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("RuntimeException del servicio se propaga correctamente")
        void givenServiceThrows_whenUpdateCredentials_thenExceptionPropagates() {
            UpdateSensible requestDto = new UpdateSensible("wrongPass", null, null);
            doThrow(new RuntimeException("Error: la contraseña es incorrecta"))
                    .when(userService).updateSensibleData(any(UUID.class), any(UpdateSensible.class));

            assertThatThrownBy(() -> mockMvc.perform(patch("/api/v1/users/me/credentials")
                    .with(authentication(buildAuth(authenticatedUser)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDto))))
                    .hasRootCauseInstanceOf(RuntimeException.class)
                    .hasRootCauseMessage("Error: la contraseña es incorrecta");
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/me/logout
    // =========================================================================

    @Nested
    @DisplayName("PATCH /me/logout")
    class LogoutEndpoint {

        @Test
        @DisplayName("Returns 204 No Content para usuario autenticado")
        void givenAuthenticatedUser_whenLogout_thenReturns204() throws Exception {
            doNothing().when(userService).logout(any(UUID.class));

            mockMvc.perform(patch("/api/v1/users/me/logout")
                    .with(authentication(buildAuth(authenticatedUser))))
                    .andExpect(status().isNoContent());

            verify(userService).logout(authenticatedUser.getId());
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenLogout_thenReturns403() throws Exception {
            mockMvc.perform(patch("/api/v1/users/me/logout"))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/me/delete/soft
    // =========================================================================

    @Nested
    @DisplayName("PATCH /me/delete/soft")
    class DeleteSoftEndpoint {

        @Test
        @DisplayName("Returns 204 No Content para usuario autenticado")
        void givenAuthenticatedUser_whenDeleteSoft_thenReturns204() throws Exception {
            doNothing().when(userService).deleteUserSoft(any(UUID.class));

            mockMvc.perform(patch("/api/v1/users/me/delete/soft")
                    .with(authentication(buildAuth(authenticatedUser))))
                    .andExpect(status().isNoContent());

            verify(userService).deleteUserSoft(authenticatedUser.getId());
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenDeleteSoft_thenReturns403() throws Exception {
            mockMvc.perform(patch("/api/v1/users/me/delete/soft"))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // DELETE /api/v1/users/hard/{userId}
    // =========================================================================

    @Nested
    @DisplayName("DELETE /hard/{userId}")
    class DeleteHardEndpoint {

        @Test
        @DisplayName("Returns 204 No Content for ADMIN")
        @WithMockUser(authorities = "ADMIN")
        void givenAdminUser_whenDeleteHard_thenReturns204() throws Exception {
            UUID targetId = UUID.randomUUID();
            doNothing().when(userService).deleteUserHard(any(UUID.class));

            mockMvc.perform(delete("/api/v1/users/hard/{userId}", targetId))
                    .andExpect(status().isNoContent());

            verify(userService).deleteUserHard(targetId);
        }

        @Test
        @DisplayName("usuario con rol USER recibe 403 Forbidden")
        @WithMockUser(authorities = "USER")
        void givenRegularUser_whenDeleteHard_thenReturns403() throws Exception {
            mockMvc.perform(delete("/api/v1/users/hard/{userId}", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenDeleteHard_thenReturns403() throws Exception {
            mockMvc.perform(delete("/api/v1/users/hard/{userId}", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/{userId}/ban
    // =========================================================================

    @Nested
    @DisplayName("PATCH /{userId}/ban")
    class BanUserEndpoint {

        @Test
        @DisplayName("Returns 204 No Content for ADMIN")
        @WithMockUser(authorities = "ADMIN")
        void givenAdminUser_whenBanUser_thenReturns204() throws Exception {
            UUID targetId = UUID.randomUUID();
            doNothing().when(userService).banUser(any(UUID.class), anyString(), any(LocalDateTime.class));

            BanRequest req = new BanRequest("bad behavior", LocalDateTime.now().plusDays(5));

            mockMvc.perform(patch("/api/v1/users/{userId}/ban", targetId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isNoContent());

            verify(userService).banUser(eq(targetId), eq("bad behavior"), any(LocalDateTime.class));
        }

        @Test
        @DisplayName("usuario con rol USER recibe 403 Forbidden")
        @WithMockUser(authorities = "USER")
        void givenRegularUser_whenBanUser_thenReturns403() throws Exception {
            BanRequest req = new BanRequest("bad behavior", LocalDateTime.now().plusDays(5));

            mockMvc.perform(patch("/api/v1/users/{userId}/ban", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenBanUser_thenReturns403() throws Exception {
            BanRequest req = new BanRequest("bad behavior", LocalDateTime.now().plusDays(5));

            mockMvc.perform(patch("/api/v1/users/{userId}/ban", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/{userId}/unban
    // =========================================================================

    @Nested
    @DisplayName("PATCH /{userId}/unban")
    class UnbanUserEndpoint {

        @Test
        @DisplayName("Returns 204 No Content for ADMIN")
        @WithMockUser(authorities = "ADMIN")
        void givenAdminUser_whenUnbanUser_thenReturns204() throws Exception {
            UUID targetId = UUID.randomUUID();
            doNothing().when(userService).unbanUser(any(UUID.class));

            mockMvc.perform(patch("/api/v1/users/{userId}/unban", targetId))
                    .andExpect(status().isNoContent());

            verify(userService).unbanUser(targetId);
        }

        @Test
        @DisplayName("usuario con rol USER recibe 403 Forbidden")
        @WithMockUser(authorities = "USER")
        void givenRegularUser_whenUnbanUser_thenReturns403() throws Exception {
            mockMvc.perform(patch("/api/v1/users/{userId}/unban", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenUnbanUser_thenReturns403() throws Exception {
            mockMvc.perform(patch("/api/v1/users/{userId}/unban", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/me/profile-picture
    // =========================================================================

    @Nested
    @DisplayName("PATCH /me/profile-picture")
    class UploadProfilePictureEndpoint {

        @Test
        @DisplayName("usuario autenticado sube foto de perfil y recibe 200 con la URL")
        void givenAuthenticatedUser_whenUploadProfilePicture_thenReturns200WithUrl() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "avatar.jpg", MediaType.IMAGE_JPEG_VALUE, "image-content".getBytes());
            when(userService.uploadProfilePicture(any(UUID.class), any())).thenReturn("https://cloudinary.com/avatar.jpg");

            mockMvc.perform(multipart("/api/v1/users/me/profile-picture")
                    .file(file)
                    .with(request -> { request.setMethod("PATCH"); return request; })
                    .with(authentication(buildAuth(authenticatedUser))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.profilePicUrl").value("https://cloudinary.com/avatar.jpg"));

            verify(userService).uploadProfilePicture(eq(authenticatedUser.getId()), any());
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 Forbidden")
        void givenUnauthenticated_whenUploadProfilePicture_thenReturns403() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "avatar.jpg", MediaType.IMAGE_JPEG_VALUE, "image-content".getBytes());

            mockMvc.perform(multipart("/api/v1/users/me/profile-picture")
                    .file(file)
                    .with(request -> { request.setMethod("PATCH"); return request; }))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }
}
