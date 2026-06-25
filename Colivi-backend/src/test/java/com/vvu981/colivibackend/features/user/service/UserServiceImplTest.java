package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.*;
import com.vvu981.colivibackend.features.user.mapper.UserMapper;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios de UserServiceImpl.
 * Todas las dependencias externas están mockeadas. No se levanta contexto
 * Spring.
 *
 * HISTORIAL DE BUGS: Este test suite detectó un bug crítico en producción:
 * UserServiceImpl.updateSensibleData() tenía la condición de guarda INVERTIDA.
 * Usaba `if (passwordEncoder.matches(...))` en lugar de `if
 * (!passwordEncoder.matches(...))`.
 * Consecuencia: lanzaba excepción cuando la contraseña era CORRECTA
 * (autenticación rota).
 * Bug corregido: línea 116 de UserServiceImpl ahora usa
 * `!passwordEncoder.matches(...)`.
 */

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl")
class UserServiceImplTest {

        @Mock
        private UserRepository userRepository;
        @Mock
        private JwtTokenProvider jwtTokenProvider;
        @Mock
        private PasswordEncoder passwordEncoder;
        @Mock
        private UserMapper userMapper;

        @InjectMocks
        private UserServiceImpl userService;

        private User persistedUser;

        @BeforeEach
        void setUp() {
                persistedUser = new User();
                persistedUser.setId(UUID.randomUUID());
                persistedUser.setEmail("victor@colivi.com");
                persistedUser.setNickname("vvu981");
                persistedUser.setPasswordHash("$2a$12$hashedPassword");
                persistedUser.setFirstName("Víctor");
                persistedUser.setLastName1("Vallejo");
                persistedUser.setRole(UserRole.USER);
                persistedUser.setTokenVersion(1);
        }

        // =========================================================================
        // login
        // =========================================================================

        @Nested
        @DisplayName("login")
        class Login {

                @Test
                @DisplayName("happy path: credenciales válidas devuelven un AuthResponse con tokens")
                void givenValidCredentials_whenLogin_thenReturnsAuthResponse() {
                        // Arrange
                        LoginRequest request = new LoginRequest("victor@colivi.com", "password123");
                        when(userRepository.findByEmailAndDeletedAtIsNull("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("password123", persistedUser.getPasswordHash()))
                                        .thenReturn(true);
                        when(jwtTokenProvider.generateAccessToken(persistedUser)).thenReturn("access.token");
                        when(jwtTokenProvider.generateRefreshToken(persistedUser)).thenReturn("refresh.token");

                        // Act
                        AuthResponse response = userService.login(request);

                        // Assert
                        assertThat(response.accessToken()).isEqualTo("access.token");
                        assertThat(response.refreshToken()).isEqualTo("refresh.token");
                        assertThat(response.expiresIn()).isEqualTo(86_400_000L);
                }

                @Test
                @DisplayName("usuario no encontrado lanza RuntimeException con mensaje genérico")
                void givenNonExistentEmail_whenLogin_thenThrowsRuntimeException() {
                        // Arrange
                        LoginRequest request = new LoginRequest("ghost@colivi.com", "password123");
                        when(userRepository.findByEmailAndDeletedAtIsNull("ghost@colivi.com"))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.login(request))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("Credenciales inválidas");
                }

                @Test
                @DisplayName("contraseña incorrecta lanza RuntimeException con mensaje genérico")
                void givenWrongPassword_whenLogin_thenThrowsRuntimeException() {
                        // Arrange
                        LoginRequest request = new LoginRequest("victor@colivi.com", "wrong_password");
                        when(userRepository.findByEmailAndDeletedAtIsNull("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("wrong_password", persistedUser.getPasswordHash()))
                                        .thenReturn(false);

                        // Act & Assert
                        assertThatThrownBy(() -> userService.login(request))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("Credenciales inválidas");

                        // Garantizamos que no se generaron tokens
                        verifyNoInteractions(jwtTokenProvider);
                }

                @Test
                @DisplayName("el mensaje de error es idéntico para email y contraseña incorrectos (no oráculos)")
                void givenWrongEmailOrPassword_whenLogin_thenSameGenericMessage() {
                        // Arrange — email inexistente
                        LoginRequest badEmail = new LoginRequest("nobody@colivi.com", "pass");
                        when(userRepository.findByEmailAndDeletedAtIsNull("nobody@colivi.com"))
                                        .thenReturn(Optional.empty());

                        // Arrange — contraseña incorrecta
                        LoginRequest badPass = new LoginRequest("victor@colivi.com", "wrong");
                        when(userRepository.findByEmailAndDeletedAtIsNull("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("wrong", persistedUser.getPasswordHash()))
                                        .thenReturn(false);

                        // Act & Assert
                        String msgBadEmail = catchThrowable(() -> userService.login(badEmail))
                                        .getMessage();
                        String msgBadPass = catchThrowable(() -> userService.login(badPass))
                                        .getMessage();

                        assertThat(msgBadEmail).isEqualTo(msgBadPass);
                }
        }

        // =========================================================================
        // register
        // =========================================================================

        @Nested
        @DisplayName("register")
        class Register {

                private RegisterRequest validRequest;

                @BeforeEach
                void setUpRegister() {
                        validRequest = new RegisterRequest(
                                        "vvu981", "nuevo@colivi.com", "SecurePass1!",
                                        "Víctor", "Vallejo", "Uroz", "+34600000000");
                }

                @Test
                @DisplayName("happy path: nuevo usuario devuelve AuthResponse con tokens")
                void givenNewUser_whenRegister_thenReturnsAuthResponse() {
                        // Arrange
                        when(userRepository.findByEmailAndDeletedAtIsNull("nuevo@colivi.com"))
                                        .thenReturn(Optional.empty());
                        when(userRepository.findByNicknameAndDeletedAtIsNull("vvu981"))
                                        .thenReturn(Optional.empty());
                        when(passwordEncoder.encode("SecurePass1!")).thenReturn("$2a$12$encoded");
                        when(userRepository.save(any(User.class))).thenReturn(persistedUser);
                        when(jwtTokenProvider.generateAccessToken(persistedUser)).thenReturn("new.access");
                        when(jwtTokenProvider.generateRefreshToken(persistedUser)).thenReturn("new.refresh");

                        // Act
                        AuthResponse response = userService.register(validRequest);

                        // Assert
                        assertThat(response.accessToken()).isEqualTo("new.access");
                        assertThat(response.refreshToken()).isEqualTo("new.refresh");
                        verify(userRepository).save(any(User.class));
                }

                @Test
                @DisplayName("email duplicado lanza RuntimeException")
                void givenDuplicateEmail_whenRegister_thenThrowsRuntimeException() {
                        // Arrange
                        when(userRepository.findByEmailAndDeletedAtIsNull("nuevo@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.register(validRequest))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("email ya está registrado");

                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("nickname duplicado lanza RuntimeException")
                void givenDuplicateNickname_whenRegister_thenThrowsRuntimeException() {
                        // Arrange
                        when(userRepository.findByEmailAndDeletedAtIsNull("nuevo@colivi.com"))
                                        .thenReturn(Optional.empty());
                        when(userRepository.findByNicknameAndDeletedAtIsNull("vvu981"))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.register(validRequest))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("apodo ya está en uso");

                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("el usuario guardado tiene rol USER (nunca ADMIN) y contraseña hasheada")
                void givenNewUser_whenRegister_thenSavedWithUserRoleAndHashedPassword() {
                        // Arrange
                        when(userRepository.findByEmailAndDeletedAtIsNull(anyString())).thenReturn(Optional.empty());
                        when(userRepository.findByNicknameAndDeletedAtIsNull(anyString())).thenReturn(Optional.empty());
                        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashed");
                        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
                        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("tok");
                        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("ref");

                        // Act
                        userService.register(validRequest);

                        // Assert — capturamos el User que se pasó a save()
                        verify(userRepository).save(argThat(savedUser -> savedUser.getRole() == UserRole.USER &&
                                        "$2a$12$hashed".equals(savedUser.getPasswordHash())));
                }
        }

        // =========================================================================
        // refreshToken
        // =========================================================================

        @Nested
        @DisplayName("refreshToken")
        class RefreshToken {

                @Test
                @DisplayName("happy path: refresh token válido devuelve nuevo access token y refresh token")
                void givenValidRefreshToken_whenRefresh_thenReturnsNewAccessToken() {
                        // Arrange
                        RefreshTokenRequest request = new RefreshTokenRequest("valid.refresh.token");
                        when(jwtTokenProvider.isTokenValid("valid.refresh.token")).thenReturn(true);
                        when(jwtTokenProvider.extractEmail("valid.refresh.token")).thenReturn("victor@colivi.com");
                        when(userRepository.findByEmailAndDeletedAtIsNull("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(jwtTokenProvider.extractTokenVersion("valid.refresh.token")).thenReturn(1);
                        when(jwtTokenProvider.generateAccessToken(persistedUser)).thenReturn("new.access.token");
                        when(jwtTokenProvider.generateRefreshToken(persistedUser)).thenReturn("new.refresh.token");

                        // Act
                        AuthResponse response = userService.refreshToken(request);

                        // Assert
                        assertThat(response.accessToken()).isEqualTo("new.access.token");
                        // El refresh token rota
                        assertThat(response.refreshToken()).isEqualTo("new.refresh.token");
                }

                @Test
                @DisplayName("refresh token inválido o expirado lanza RuntimeException")
                void givenInvalidRefreshToken_whenRefresh_thenThrowsRuntimeException() {
                        // Arrange
                        RefreshTokenRequest request = new RefreshTokenRequest("expired.or.invalid.token");
                        when(jwtTokenProvider.isTokenValid("expired.or.invalid.token")).thenReturn(false);

                        // Act & Assert
                        assertThatThrownBy(() -> userService.refreshToken(request))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("inválido o caducado");

                        verifyNoInteractions(userRepository);
                }

                @Test
                @DisplayName("usuario del refresh token no existe en BD lanza RuntimeException")
                void givenTokenWithNonExistentUser_whenRefresh_thenThrowsRuntimeException() {
                        // Arrange
                        RefreshTokenRequest request = new RefreshTokenRequest("valid.token.dead.user");
                        when(jwtTokenProvider.isTokenValid("valid.token.dead.user")).thenReturn(true);
                        when(jwtTokenProvider.extractEmail("valid.token.dead.user")).thenReturn("deleted@colivi.com");
                        when(userRepository.findByEmailAndDeletedAtIsNull("deleted@colivi.com"))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.refreshToken(request))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("Usuario no encontrado");
                }
        }

        // =========================================================================
        // setAdmin
        // =========================================================================

        @Nested
        @DisplayName("setAdmin")
        class SetAdmin {

                @Test
                @DisplayName("happy path: el rol del usuario se eleva a ADMIN y se persiste")
                void givenExistingUser_whenSetAdmin_thenRoleIsAdminAndSaved() {
                        // Arrange
                        UUID userId = persistedUser.getId();
                        when(userRepository.findByIdAndDeletedAtIsNull(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.setAdmin(userId);

                        // Assert
                        assertThat(persistedUser.getRole()).isEqualTo(UserRole.ADMIN);
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("usuario no encontrado lanza RuntimeException")
                void givenNonExistentUserId_whenSetAdmin_thenThrowsRuntimeException() {
                        // Arrange
                        UUID unknownId = UUID.randomUUID();
                        when(userRepository.findByIdAndDeletedAtIsNull(unknownId))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.setAdmin(unknownId))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("Usuario no encontrado");

                        verify(userRepository, never()).save(any());
                }
        }

        // =========================================================================
        // updateNonSensibleData
        // =========================================================================

        @Nested
        @DisplayName("updateNonSensibleData")
        class UpdateNonSensibleData {

                @Test
                @DisplayName("happy path: delega al mapper y persiste, devolviendo DTO actualizado")
                void givenValidUpdate_whenUpdateNonSensible_thenMapperCalledAndDtoReturned() {
                        // Arrange
                        UpdateNonSensible updateRequest = new UpdateNonSensible(
                                        "newNick", "NuevoNombre", "NuevoApellido", null, "+34699999999", null);
                        UpdateNonSensible expectedResponse = new UpdateNonSensible(
                                        "newNick", "NuevoNombre", "NuevoApellido", null, "+34699999999", null);
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);
                        when(userMapper.toUpdateNonSensibleDto(persistedUser)).thenReturn(expectedResponse);

                        // Act
                        UpdateNonSensible result = userService.updateNonSensibleData(persistedUser, updateRequest);

                        // Assert
                        verify(userMapper).updateEntityFromDto(updateRequest, persistedUser);
                        verify(userRepository).save(persistedUser);
                        assertThat(result).isEqualTo(expectedResponse);
                }
        }

        // =========================================================================
        // updateSensibleData
        // =========================================================================

        @Nested
        @DisplayName("updateSensibleData")
        class UpdateSensibleData {

                /**
                 * Contraseña actual incorrecta debe lanzar RuntimeException.
                 * NOTA: Este test detectó y corrigió un bug de producción en UserServiceImpl
                 * donde la condición estaba invertida (matches en lugar de !matches).
                 */
                @Test
                @DisplayName("contraseña actual INCORRECTA lanza RuntimeException")
                void givenWrongCurrentPassword_whenUpdateSensible_thenThrowsRuntimeException() {
                        // Arrange
                        UpdateSensible request = new UpdateSensible("wrong_current", "new@email.com", null);
                        when(passwordEncoder.matches("wrong_current", persistedUser.getPasswordHash()))
                                        .thenReturn(false); // contraseña incorrecta

                        // Act & Assert
                        // Con el código actual (bug): NO lanza excepción cuando debería hacerlo.
                        // Este test captura el comportamiento CORRECTO esperado.
                        assertThatThrownBy(() -> userService.updateSensibleData(persistedUser, request))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("contraseña es incorrecta");

                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("contraseña actual CORRECTA con nuevo email actualiza el email y persiste")
                void givenCorrectCurrentPassword_whenUpdateEmailOnly_thenEmailUpdatedAndSaved() {
                        // Arrange
                        UpdateSensible request = new UpdateSensible("correct_current", "nuevo@colivi.com", null);
                        when(passwordEncoder.matches("correct_current", persistedUser.getPasswordHash()))
                                        .thenReturn(true);
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.updateSensibleData(persistedUser, request);

                        // Assert
                        assertThat(persistedUser.getEmail()).isEqualTo("nuevo@colivi.com");
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("contraseña actual CORRECTA con nueva contraseña la hashea y persiste")
                void givenCorrectCurrentPassword_whenUpdatePasswordOnly_thenPasswordHashedAndSaved() {

                        // Arrange
                        UpdateSensible request = new UpdateSensible("correct_current", null, "NewSecure1!");
                        when(passwordEncoder.matches("correct_current", persistedUser.getPasswordHash()))
                                        .thenReturn(true);
                        when(passwordEncoder.encode("NewSecure1!")).thenReturn("$2a$12$newHashed");
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.updateSensibleData(persistedUser, request);

                        // Assert
                        assertThat(persistedUser.getPasswordHash()).isEqualTo("$2a$12$newHashed");
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("sin cambios (newEmail y newPassword son null/blank) no persiste en BD")
                void givenNoChanges_whenUpdateSensible_thenRepositoryNotCalled() {
                        // Arrange — nada que cambiar
                        UpdateSensible request = new UpdateSensible("correct_current", null, null);
                        when(passwordEncoder.matches("correct_current", persistedUser.getPasswordHash()))
                                        .thenReturn(true);

                        // Act
                        userService.updateSensibleData(persistedUser, request);

                        // Assert — no se guardó nada innecesariamente
                        verify(userRepository, never()).save(any());
                }
        }

        // =========================================================================
        // deleteUserSoft
        // =========================================================================

        @Nested
        @DisplayName("deleteUserSoft")
        class DeleteUserSoft {

                @Test
                @DisplayName("happy path: usuario existente obtiene deletedAt y se persiste")
                void givenExistingUser_whenDeleteUserSoft_thenDeletedAtSetAndSaved() {
                        // Arrange
                        UUID userId = persistedUser.getId();
                        assertThat(persistedUser.getDeletedAt()).isNull(); // precondición
                        when(userRepository.findByIdAndDeletedAtIsNull(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.deleteUserSoft(userId);

                        // Assert — el campo deletedAt fue asignado y el usuario fue persistido
                        assertThat(persistedUser.getDeletedAt()).isNotNull();
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("el timestamp de deletedAt es anterior o igual al momento de la llamada")
                void givenExistingUser_whenDeleteUserSoft_thenDeletedAtIsBeforeOrEqualNow() {
                        // Arrange
                        UUID userId = persistedUser.getId();
                        when(userRepository.findByIdAndDeletedAtIsNull(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        java.time.LocalDateTime before = java.time.LocalDateTime.now();

                        // Act
                        userService.deleteUserSoft(userId);

                        java.time.LocalDateTime after = java.time.LocalDateTime.now();

                        // Assert — el timestamp debe estar en el rango [before, after]
                        assertThat(persistedUser.getDeletedAt())
                                        .isAfterOrEqualTo(before)
                                        .isBeforeOrEqualTo(after);
                }

                @Test
                @DisplayName("usuario no encontrado lanza RuntimeException y no persiste nada")
                void givenNonExistentUserId_whenDeleteUserSoft_thenThrowsRuntimeException() {
                        // Arrange
                        UUID unknownId = UUID.randomUUID();
                        when(userRepository.findByIdAndDeletedAtIsNull(unknownId))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.deleteUserSoft(unknownId))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("Usuario no encontrado");

                        verify(userRepository, never()).save(any());
                }
        }

        // =========================================================================
        // deleteUserHard
        // =========================================================================

        @Nested
        @DisplayName("deleteUserHard")
        class DeleteUserHard {

                @Test
                @DisplayName("happy path: usuario existente se elimina físicamente de la BD")
                void givenExistingUser_whenDeleteUserHard_thenRepositoryDeleteCalled() {
                        // Arrange
                        UUID userId = persistedUser.getId();
                        when(userRepository.findByIdAndDeletedAtIsNull(userId))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act
                        userService.deleteUserHard(userId);

                        // Assert — se delegó en delete(), nunca en save()
                        verify(userRepository).delete(persistedUser);
                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("usuario no encontrado lanza RuntimeException y no elimina nada")
                void givenNonExistentUserId_whenDeleteUserHard_thenThrowsRuntimeException() {
                        // Arrange
                        UUID unknownId = UUID.randomUUID();
                        when(userRepository.findByIdAndDeletedAtIsNull(unknownId))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.deleteUserHard(unknownId))
                                        .isInstanceOf(RuntimeException.class)
                                        .hasMessageContaining("Usuario no encontrado");

                        verify(userRepository, never()).delete(any());
                }
                // =========================================================================
                // logout
                // =========================================================================

                @Nested
                @DisplayName("logout")
                class Logout {

                        @Test
                        @DisplayName("happy path: incrementa tokenVersion y guarda usuario")
                        void givenAuthenticatedUser_whenLogout_thenTokenVersionIncrementedAndSaved() {
                                // Arrange
                                UUID userId = persistedUser.getId();
                                Integer originalVersion = persistedUser.getTokenVersion();
                                when(userRepository.findByIdAndDeletedAtIsNull(userId))
                                                .thenReturn(Optional.of(persistedUser));
                                when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                                // Act
                                userService.logout(persistedUser);

                                // Assert
                                assertThat(persistedUser.getTokenVersion()).isEqualTo(originalVersion + 1);
                                verify(userRepository).save(persistedUser);
                        }

                        @Test
                        @DisplayName("usuario no encontrado lanza RuntimeException")
                        void givenNonExistentUser_whenLogout_thenThrowsRuntimeException() {
                                // Arrange
                                UUID unknownId = UUID.randomUUID();
                                User unknownUser = new User();
                                unknownUser.setId(unknownId);

                                when(userRepository.findByIdAndDeletedAtIsNull(unknownId))
                                                .thenReturn(Optional.empty());

                                // Act & Assert
                                assertThatThrownBy(() -> userService.logout(unknownUser))
                                                .isInstanceOf(RuntimeException.class)
                                                .hasMessageContaining("Usuario no encontrado");

                                verify(userRepository, never()).save(any());
                        }
                }

                // =========================================================================
                // banUser
                // =========================================================================

                @Nested
                @DisplayName("banUser")
                class BanUser {

                        @Test
                        @DisplayName("happy path: usuario se banea con la fecha y motivo correctos")
                        void givenExistingUser_whenBanUser_thenBannedAndSaved() {
                                // Arrange
                                UUID userId = persistedUser.getId();
                                when(userRepository.findByIdAndDeletedAtIsNull(userId))
                                                .thenReturn(Optional.of(persistedUser));
                                when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                                // Act
                                userService.banUser(userId, "Mal comportamiento", 5L);

                                // Assert
                                assertThat(persistedUser.getBannedAt()).isNotNull();
                                assertThat(persistedUser.getBanReason()).isEqualTo("Mal comportamiento");
                                assertThat(persistedUser.getBannedUntil())
                                                .isAfter(java.time.LocalDateTime.now().plusDays(4));
                                verify(userRepository).save(persistedUser);
                        }
                }

                // =========================================================================
                // unbanUser
                // =========================================================================

                @Nested
                @DisplayName("unbanUser")
                class UnbanUser {

                        @Test
                        @DisplayName("happy path: usuario se desbanea limpiando bannedAt")
                        void givenExistingUser_whenUnbanUser_thenUnbannedAndSaved() {
                                // Arrange
                                UUID userId = persistedUser.getId();
                                persistedUser.setBannedAt(java.time.LocalDateTime.now());
                                when(userRepository.findByIdAndDeletedAtIsNull(userId))
                                                .thenReturn(Optional.of(persistedUser));
                                when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                                // Act
                                userService.unbanUser(userId);

                                // Assert
                                assertThat(persistedUser.getBannedAt()).isNull();
                                verify(userRepository).save(persistedUser);
                        }
                }
        }
}
