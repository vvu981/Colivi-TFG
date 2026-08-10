package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.*;
import com.vvu981.colivibackend.features.user.exception.AccountAlreadyActiveException;
import com.vvu981.colivibackend.features.user.exception.InvalidReactivationTokenException;
import com.vvu981.colivibackend.features.user.mapper.UserMapper;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
import com.vvu981.colivibackend.features.user.exception.UserNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import com.vvu981.colivibackend.features.user.domain.UserReactivationRequestedEvent;

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
        private com.vvu981.colivibackend.features.home.repository.ActivityLogRepository activityLogRepository;
        @Mock
        private JwtTokenProvider jwtTokenProvider;
        @Mock
        private PasswordEncoder passwordEncoder;
        @Mock
        private UserMapper userMapper;
        @Mock
        private ApplicationEventPublisher eventPublisher;

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
                        when(userRepository.findActiveByEmail("victor@colivi.com"))
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
                @DisplayName("usuario no encontrado lanza UnauthorizedActionException con mensaje genérico")
                void givenNonExistentEmail_whenLogin_thenThrowsUnauthorizedActionException() {
                        // Arrange
                        LoginRequest request = new LoginRequest("ghost@colivi.com", "password123");
                        when(userRepository.findActiveByEmail("ghost@colivi.com"))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.login(request))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("Credenciales inválidas");
                }

                @Test
                @DisplayName("contraseña incorrecta lanza UnauthorizedActionException con mensaje genérico")
                void givenWrongPassword_whenLogin_thenThrowsUnauthorizedActionException() {
                        // Arrange
                        LoginRequest request = new LoginRequest("victor@colivi.com", "wrong_password");
                        when(userRepository.findActiveByEmail("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("wrong_password", persistedUser.getPasswordHash()))
                                        .thenReturn(false);

                        // Act & Assert
                        assertThatThrownBy(() -> userService.login(request))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("Credenciales inválidas");

                        // Garantizamos que no se generaron tokens
                        verifyNoInteractions(jwtTokenProvider);
                }

                @Test
                @DisplayName("el mensaje de error es idéntico para email y contraseña incorrectos (no oráculos)")
                void givenWrongEmailOrPassword_whenLogin_thenSameGenericMessage() {
                        // Arrange — email inexistente
                        LoginRequest badEmail = new LoginRequest("nobody@colivi.com", "pass");
                        when(userRepository.findActiveByEmail("nobody@colivi.com"))
                                        .thenReturn(Optional.empty());

                        // Arrange — contraseña incorrecta
                        LoginRequest badPass = new LoginRequest("victor@colivi.com", "wrong");
                        when(userRepository.findActiveByEmail("victor@colivi.com"))
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
                        when(userRepository.findActiveByEmail("nuevo@colivi.com"))
                                        .thenReturn(Optional.empty());
                        when(userRepository.findActiveByNickname("vvu981"))
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
                @DisplayName("email duplicado lanza BusinessRuleValidationException")
                void givenDuplicateEmail_whenRegister_thenThrowsBusinessRuleValidationException() {
                        // Arrange
                        when(userRepository.findActiveByEmail("nuevo@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.register(validRequest))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("email ya está registrado");

                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("nickname duplicado lanza BusinessRuleValidationException")
                void givenDuplicateNickname_whenRegister_thenThrowsBusinessRuleValidationException() {
                        // Arrange
                        when(userRepository.findActiveByEmail("nuevo@colivi.com"))
                                        .thenReturn(Optional.empty());
                        when(userRepository.findActiveByNickname("vvu981"))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.register(validRequest))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("apodo ya está en uso");

                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("el usuario guardado tiene rol USER (nunca ADMIN) y contraseña hasheada")
                void givenNewUser_whenRegister_thenSavedWithUserRoleAndHashedPassword() {
                        // Arrange
                        when(userRepository.findActiveByEmail(anyString())).thenReturn(Optional.empty());
                        when(userRepository.findActiveByNickname(anyString())).thenReturn(Optional.empty());
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
                        when(userRepository.findActiveByEmail("victor@colivi.com"))
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
                @DisplayName("refresh token inválido o expirado lanza InvalidTokenException")
                void givenInvalidRefreshToken_whenRefresh_thenThrowsInvalidTokenException() {
                        // Arrange
                        RefreshTokenRequest request = new RefreshTokenRequest("expired.or.invalid.token");
                        when(jwtTokenProvider.isTokenValid("expired.or.invalid.token")).thenReturn(false);

                        // Act & Assert
                        assertThatThrownBy(() -> userService.refreshToken(request))
                                        .isInstanceOf(InvalidTokenException.class)
                                        .hasMessageContaining("inválido o caducado");

                        verifyNoInteractions(userRepository);
                }

                @Test
                @DisplayName("usuario del refresh token no existe en BD lanza UserNotFoundException")
                void givenTokenWithNonExistentUser_whenRefresh_thenThrowsUserNotFoundException() {
                        // Arrange
                        RefreshTokenRequest request = new RefreshTokenRequest("valid.token.dead.user");
                        when(jwtTokenProvider.isTokenValid("valid.token.dead.user")).thenReturn(true);
                        when(jwtTokenProvider.extractEmail("valid.token.dead.user")).thenReturn("deleted@colivi.com");
                        when(userRepository.findActiveByEmail("deleted@colivi.com"))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.refreshToken(request))
                                        .isInstanceOf(UserNotFoundException.class)
                                        .hasMessageContaining("Usuario no encontrado");
                }

                @Test
                @DisplayName("versión del token discrepante lanza StaleSessionException")
                void givenMismatchingTokenVersion_whenRefresh_thenThrowsStaleSessionException() {
                        // Arrange
                        RefreshTokenRequest request = new RefreshTokenRequest("mismatch.version.token");
                        when(jwtTokenProvider.isTokenValid("mismatch.version.token")).thenReturn(true);
                        when(jwtTokenProvider.extractEmail("mismatch.version.token")).thenReturn("victor@colivi.com");
                        when(userRepository.findActiveByEmail("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(jwtTokenProvider.extractTokenVersion("mismatch.version.token")).thenReturn(99); // Versión en DB es 1

                        // Act & Assert
                        assertThatThrownBy(() -> userService.refreshToken(request))
                                        .isInstanceOf(com.vvu981.colivibackend.features.user.exception.StaleSessionException.class)
                                        .hasMessageContaining("La sesión ha expirado");
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
                        when(userRepository.findActiveById(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.setAdmin(userId);

                        // Assert
                        assertThat(persistedUser.getRole()).isEqualTo(UserRole.ADMIN);
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("usuario no encontrado lanza UserNotFoundException")
                void givenNonExistentUserId_whenSetAdmin_thenThrowsUserNotFoundException() {
                        // Arrange
                        UUID unknownId = UUID.randomUUID();
                        when(userRepository.findActiveById(unknownId))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.setAdmin(unknownId))
                                        .isInstanceOf(UserNotFoundException.class)
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
                        when(userRepository.findActiveById(persistedUser.getId()))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);
                        when(userMapper.toUpdateNonSensibleDto(persistedUser)).thenReturn(expectedResponse);

                        // Act
                        UpdateNonSensible result = userService.updateNonSensibleData(persistedUser.getId(),
                                        updateRequest);

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
                @DisplayName("contraseña actual INCORRECTA lanza UnauthorizedActionException")
                void givenWrongCurrentPassword_whenUpdateSensible_thenThrowsUnauthorizedActionException() {
                        // Arrange
                        UpdateSensible request = new UpdateSensible("wrong_current", "new@email.com", null);
                        when(userRepository.findActiveById(persistedUser.getId()))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("wrong_current", persistedUser.getPasswordHash()))
                                        .thenReturn(false); // contraseña incorrecta

                        // Act & Assert
                        assertThatThrownBy(() -> userService.updateSensibleData(persistedUser.getId(), request))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("contraseña es incorrecta");

                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("contraseña actual CORRECTA con nuevo email actualiza el email y persiste")
                void givenCorrectCurrentPassword_whenUpdateEmailOnly_thenEmailUpdatedAndSaved() {
                        // Arrange
                        UpdateSensible request = new UpdateSensible("correct_current", "nuevo@colivi.com", null);
                        when(userRepository.findActiveById(persistedUser.getId()))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("correct_current", persistedUser.getPasswordHash()))
                                        .thenReturn(true);
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.updateSensibleData(persistedUser.getId(), request);

                        // Assert
                        assertThat(persistedUser.getEmail()).isEqualTo("nuevo@colivi.com");
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("contraseña actual CORRECTA con nueva contraseña la hashea y persiste")
                void givenCorrectCurrentPassword_whenUpdatePasswordOnly_thenPasswordHashedAndSaved() {

                        // Arrange
                        UpdateSensible request = new UpdateSensible("correct_current", null, "NewSecure1!");
                        when(userRepository.findActiveById(persistedUser.getId()))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("correct_current", persistedUser.getPasswordHash()))
                                        .thenReturn(true);
                        when(passwordEncoder.encode("NewSecure1!")).thenReturn("$2a$12$newHashed");
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.updateSensibleData(persistedUser.getId(), request);

                        // Assert
                        assertThat(persistedUser.getPasswordHash()).isEqualTo("$2a$12$newHashed");
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("sin cambios (newEmail y newPassword son null/blank) no persiste en BD")
                void givenNoChanges_whenUpdateSensible_thenRepositoryNotCalled() {
                        // Arrange — nada que cambiar
                        UpdateSensible request = new UpdateSensible("correct_current", null, null);
                        when(userRepository.findActiveById(persistedUser.getId()))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("correct_current", persistedUser.getPasswordHash()))
                                        .thenReturn(true);

                        // Act
                        userService.updateSensibleData(persistedUser.getId(), request);

                        // Assert — no se guardó nada innecesariamente
                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("con campos en blanco (newEmail y newPassword son empty) no persiste en BD")
                void givenBlankChanges_whenUpdateSensible_thenRepositoryNotCalled() {
                        // Arrange — nada que cambiar
                        UpdateSensible request = new UpdateSensible("correct_current", "   ", "");
                        when(userRepository.findActiveById(persistedUser.getId()))
                                        .thenReturn(Optional.of(persistedUser));
                        when(passwordEncoder.matches("correct_current", persistedUser.getPasswordHash()))
                                        .thenReturn(true);

                        // Act
                        userService.updateSensibleData(persistedUser.getId(), request);

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
                        when(userRepository.findActiveById(userId))
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
                        when(userRepository.findActiveById(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        LocalDateTime before = LocalDateTime.now();

                        // Act
                        userService.deleteUserSoft(userId);

                        LocalDateTime after = LocalDateTime.now();

                        // Assert — el timestamp debe estar en el rango [before, after]
                        assertThat(persistedUser.getDeletedAt())
                                        .isAfterOrEqualTo(before)
                                        .isBeforeOrEqualTo(after);
                }

                @Test
                @DisplayName("usuario no encontrado lanza UserNotFoundException y no persiste nada")
                void givenNonExistentUserId_whenDeleteUserSoft_thenThrowsUserNotFoundException() {
                        // Arrange
                        UUID unknownId = UUID.randomUUID();
                        when(userRepository.findActiveById(unknownId))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.deleteUserSoft(unknownId))
                                        .isInstanceOf(UserNotFoundException.class)
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
                        when(userRepository.findById(userId))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act
                        userService.deleteUserHard(userId);

                        // Assert — se delegó en delete(), nunca en save()
                        verify(activityLogRepository).nullifyActorIdByUserId(userId);
                        verify(userRepository).delete(persistedUser);
                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("usuario no encontrado lanza UserNotFoundException y no elimina nada")
                void givenNonExistentUserId_whenDeleteUserHard_thenThrowsUserNotFoundException() {
                        // Arrange
                        UUID unknownId = UUID.randomUUID();
                        when(userRepository.findById(unknownId))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.deleteUserHard(unknownId))
                                        .isInstanceOf(UserNotFoundException.class)
                                        .hasMessageContaining("Usuario no encontrado");

                        verify(userRepository, never()).delete(any());
                }
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
                        when(userRepository.findActiveById(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.logout(persistedUser.getId());

                        // Assert
                        assertThat(persistedUser.getTokenVersion()).isEqualTo(originalVersion + 1);
                        verify(userRepository).save(persistedUser);
                }

                @Test
                @DisplayName("usuario no encontrado lanza UserNotFoundException")
                void givenNonExistentUser_whenLogout_thenThrowsUserNotFoundException() {
                        // Arrange
                        UUID unknownId = UUID.randomUUID();
                        when(userRepository.findActiveById(unknownId))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.logout(unknownId))
                                        .isInstanceOf(UserNotFoundException.class)
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
                        when(userRepository.findActiveById(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.banUser(userId, "Mal comportamiento",
                                        LocalDateTime.now().plusDays(5));

                        // Assert
                        assertThat(persistedUser.getBannedAt()).isNotNull();
                        assertThat(persistedUser.getBanReason()).isEqualTo("Mal comportamiento");
                        assertThat(persistedUser.getBannedUntil())
                                        .isAfter(LocalDateTime.now().plusDays(4));
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
                        persistedUser.setBannedAt(LocalDateTime.now());
                        when(userRepository.findActiveById(userId))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(persistedUser)).thenReturn(persistedUser);

                        // Act
                        userService.unbanUser(userId);

                        // Assert
                        assertThat(persistedUser.getBannedAt()).isNull();
                        verify(userRepository).save(persistedUser);
                }
        }

        // =========================================================================
        // requestReactivation
        // =========================================================================

        @Nested
        @DisplayName("requestReactivation")
        class RequestReactivation {

                @Test
                @DisplayName("happy path: cuenta eliminada genera token, persiste y envía correo")
                void givenSoftDeletedAccount_whenRequestReactivation_thenTokenSavedAndEmailSent() {
                        // Arrange — cuenta con soft-delete
                        persistedUser.setDeletedAt(LocalDateTime.now().minusDays(1));
                        when(userRepository.findByEmailIgnoreCase("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(any(User.class))).thenReturn(persistedUser);

                        // Act
                        userService.requestReactivation("victor@colivi.com");

                        // Assert — el token fue generado y el correo enviado
                        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
                        verify(userRepository).save(userCaptor.capture());

                        User savedUser = userCaptor.getValue();
                        assertThat(savedUser.getReactivationToken()).isNotNull().isNotBlank();
                        assertThat(savedUser.getReactivationTokenExpiresAt())
                                        .isAfter(LocalDateTime.now().plusHours(23));

                        verify(eventPublisher).publishEvent(any(UserReactivationRequestedEvent.class));
                }

                @Test
                @DisplayName("email desconocido: retorna silenciosamente sin lanzar excepción (anti user-enumeration)")
                void givenUnknownEmail_whenRequestReactivation_thenSilentReturn() {
                        // Arrange
                        when(userRepository.findByEmailIgnoreCase("unknown@colivi.com"))
                                        .thenReturn(Optional.empty());

                        // Act — no debe lanzar ninguna excepción
                        assertThatCode(() -> userService.requestReactivation("unknown@colivi.com"))
                                        .doesNotThrowAnyException();

                        // Assert — no se generó token ni se envió correo
                        verify(userRepository, never()).save(any());
                        verifyNoInteractions(eventPublisher);
                }

                @Test
                @DisplayName("cuenta ya activa (sin deletedAt) lanza AccountAlreadyActiveException")
                void givenActiveAccount_whenRequestReactivation_thenThrowsAccountAlreadyActiveException() {
                        // Arrange — cuenta activa (deletedAt == null)
                        assertThat(persistedUser.getDeletedAt()).isNull(); // precondición
                        when(userRepository.findByEmailIgnoreCase("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.requestReactivation("victor@colivi.com"))
                                        .isInstanceOf(AccountAlreadyActiveException.class)
                                        .hasMessageContaining("ya está activa");

                        verify(userRepository, never()).save(any());
                        verifyNoInteractions(eventPublisher);
                }

                @Test
                @DisplayName("el token de reactivación generado es un UUID válido")
                void givenSoftDeletedAccount_whenRequestReactivation_thenTokenIsValidUuid() {
                        // Arrange
                        persistedUser.setDeletedAt(LocalDateTime.now().minusDays(1));
                        when(userRepository.findByEmailIgnoreCase("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

                        // Act
                        userService.requestReactivation("victor@colivi.com");

                        // Assert — el token tiene formato UUID (36 caracteres con guiones)
                        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
                        verify(userRepository).save(captor.capture());

                        String token = captor.getValue().getReactivationToken();
                        assertThatCode(() -> UUID.fromString(token)).doesNotThrowAnyException();
                }

                @Test
                @DisplayName("el TTL del token de reactivación es de aproximadamente 24 horas")
                void givenSoftDeletedAccount_whenRequestReactivation_thenTokenExpiresInApprox24Hours() {
                        // Arrange
                        persistedUser.setDeletedAt(LocalDateTime.now().minusDays(1));
                        when(userRepository.findByEmailIgnoreCase("victor@colivi.com"))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

                        LocalDateTime before = LocalDateTime.now().plusHours(23).plusMinutes(59);

                        // Act
                        userService.requestReactivation("victor@colivi.com");

                        LocalDateTime after = LocalDateTime.now().plusHours(24).plusMinutes(1);

                        // Assert
                        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
                        verify(userRepository).save(captor.capture());

                        LocalDateTime expiresAt = captor.getValue().getReactivationTokenExpiresAt();
                        assertThat(expiresAt).isAfter(before).isBefore(after);
                }
        }

        // =========================================================================
        // reactivateAccount
        // =========================================================================

        @Nested
        @DisplayName("reactivateAccount")
        class ReactivateAccount {

                private static final String VALID_TOKEN = "550e8400-e29b-41d4-a716-446655440000";

                @BeforeEach
                void setUpDeletedUser() {
                        // El usuario tiene la cuenta eliminada y un token de reactivación válido
                        persistedUser.setDeletedAt(LocalDateTime.now().minusDays(1));
                        persistedUser.setReactivationToken(VALID_TOKEN);
                        persistedUser.setReactivationTokenExpiresAt(LocalDateTime.now().plusHours(23));
                }

                @Test
                @DisplayName("happy path: token válido reactiva cuenta y devuelve AuthResponse con JWT")
                void givenValidToken_whenReactivateAccount_thenAccountReactivatedAndAuthResponseReturned() {
                        // Arrange
                        when(userRepository.findByReactivationToken(VALID_TOKEN))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(any(User.class))).thenReturn(persistedUser);
                        when(jwtTokenProvider.generateAccessToken(persistedUser)).thenReturn("react.access");
                        when(jwtTokenProvider.generateRefreshToken(persistedUser)).thenReturn("react.refresh");

                        // Act
                        AuthResponse response = userService.reactivateAccount(VALID_TOKEN);

                        // Assert — JWT devueltos
                        assertThat(response.accessToken()).isEqualTo("react.access");
                        assertThat(response.refreshToken()).isEqualTo("react.refresh");
                        assertThat(response.expiresIn()).isEqualTo(86_400_000L);
                }

                @Test
                @DisplayName("la cuenta queda con deletedAt = null tras reactivar")
                void givenValidToken_whenReactivateAccount_thenDeletedAtClearedToNull() {
                        // Arrange
                        assertThat(persistedUser.getDeletedAt()).isNotNull(); // precondición
                        when(userRepository.findByReactivationToken(VALID_TOKEN))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
                        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("tok");
                        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("ref");

                        // Act
                        userService.reactivateAccount(VALID_TOKEN);

                        // Assert
                        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
                        verify(userRepository).save(captor.capture());
                        assertThat(captor.getValue().getDeletedAt()).isNull();
                }

                @Test
                @DisplayName("el token se limpia (null) tras reactivar: tokens de un solo uso")
                void givenValidToken_whenReactivateAccount_thenTokenClearedAfterUse() {
                        // Arrange
                        when(userRepository.findByReactivationToken(VALID_TOKEN))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
                        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("tok");
                        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("ref");

                        // Act
                        userService.reactivateAccount(VALID_TOKEN);

                        // Assert — token y expiración limpios
                        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
                        verify(userRepository).save(captor.capture());
                        assertThat(captor.getValue().getReactivationToken()).isNull();
                        assertThat(captor.getValue().getReactivationTokenExpiresAt()).isNull();
                }

                @Test
                @DisplayName("el tokenVersion se incrementa para invalidar sesiones anteriores al borrado")
                void givenValidToken_whenReactivateAccount_thenTokenVersionIncremented() {
                        // Arrange
                        int originalVersion = persistedUser.getTokenVersion(); // = 1
                        when(userRepository.findByReactivationToken(VALID_TOKEN))
                                        .thenReturn(Optional.of(persistedUser));
                        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
                        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("tok");
                        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("ref");

                        // Act
                        userService.reactivateAccount(VALID_TOKEN);

                        // Assert
                        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
                        verify(userRepository).save(captor.capture());
                        assertThat(captor.getValue().getTokenVersion()).isEqualTo(originalVersion + 1);
                }

                @Test
                @DisplayName("token inexistente lanza InvalidTokenException")
                void givenNonExistentToken_whenReactivateAccount_thenThrowsInvalidTokenException() {
                        // Arrange
                        when(userRepository.findByReactivationToken("bad-token"))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> userService.reactivateAccount("bad-token"))
                                        .isInstanceOf(InvalidReactivationTokenException.class)
                                        .hasMessageContaining("no es válido");

                        verify(userRepository, never()).save(any());
                        verifyNoInteractions(eventPublisher);
                }

                @Test
                @DisplayName("token caducado lanza InvalidTokenException y no reactiva la cuenta")
                void givenExpiredToken_whenReactivateAccount_thenThrowsInvalidTokenException() {
                        // Arrange — token caducado (expiró hace 1 hora)
                        persistedUser.setReactivationTokenExpiresAt(LocalDateTime.now().minusHours(1));
                        when(userRepository.findByReactivationToken(VALID_TOKEN))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.reactivateAccount(VALID_TOKEN))
                                        .isInstanceOf(InvalidReactivationTokenException.class)
                                        .hasMessageContaining("caducado");

                        // La cuenta NO debe reactivarse
                        verify(userRepository, never()).save(any());
                        assertThat(persistedUser.getDeletedAt()).isNotNull(); // sigue eliminada
                }

                @Test
                @DisplayName("token con expiresAt = null (estado inconsistente) lanza InvalidTokenException")
                void givenTokenWithNullExpiry_whenReactivateAccount_thenThrowsInvalidTokenException() {
                        // Arrange — estado de BD inconsistente: token sin TTL
                        persistedUser.setReactivationTokenExpiresAt(null);
                        when(userRepository.findByReactivationToken(VALID_TOKEN))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.reactivateAccount(VALID_TOKEN))
                                        .isInstanceOf(InvalidReactivationTokenException.class);

                        verify(userRepository, never()).save(any());
                }

                @Test
                @DisplayName("token que expira exactamente ahora es rechazado (boundary)")
                void givenTokenExpiringExactlyNow_whenReactivateAccount_thenThrowsInvalidTokenException() {
                        // Arrange — el token expira en el pasado inmediato
                        persistedUser.setReactivationTokenExpiresAt(LocalDateTime.now().minusNanos(1));
                        when(userRepository.findByReactivationToken(VALID_TOKEN))
                                        .thenReturn(Optional.of(persistedUser));

                        // Act & Assert
                        assertThatThrownBy(() -> userService.reactivateAccount(VALID_TOKEN))
                                        .isInstanceOf(InvalidReactivationTokenException.class)
                                        .hasMessageContaining("caducado");
                }
        }

    @Nested
    @DisplayName("getUserProfile")
    class GetUserProfile {
        @Test
        @DisplayName("happy path: retorna el perfil del usuario")
        void givenExistingUserId_whenGetUserProfile_thenReturnsUserProfile() {
            // Arrange
            UUID userId = persistedUser.getId();
            UserProfileResponse expectedDto = new UserProfileResponse(userId, "nick", "first", "last", null, "url", null);
            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(persistedUser));
            when(userMapper.toUserProfileDto(persistedUser)).thenReturn(expectedDto);

            // Act
            UserProfileResponse result = userService.getUserProfile(userId);

            // Assert
            assertThat(result).isEqualTo(expectedDto);
            verify(userRepository).findActiveById(userId);
            verify(userMapper).toUserProfileDto(persistedUser);
        }
    }

    @Nested
    @DisplayName("getMyProfile")
    class GetMyProfile {
        @Test
        @DisplayName("happy path: retorna el propio perfil del usuario")
        void givenExistingUserId_whenGetMyProfile_thenReturnsUserProfile() {
            // Arrange
            UUID userId = persistedUser.getId();
            com.vvu981.colivibackend.features.user.dto.MyProfileResponse expectedDto = new com.vvu981.colivibackend.features.user.dto.MyProfileResponse(
                    userId, "test@colivi.com", "123", com.vvu981.colivibackend.features.user.domain.UserRole.USER, "nick", "First", "Last", null, "url", null);
            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(persistedUser));
            when(userMapper.toMyProfileDto(persistedUser)).thenReturn(expectedDto);

            // Act
            com.vvu981.colivibackend.features.user.dto.MyProfileResponse result = userService.getMyProfile(userId);

            // Assert
            assertThat(result).isEqualTo(expectedDto);
            verify(userRepository).findActiveById(userId);
            verify(userMapper).toMyProfileDto(persistedUser);
        }
    }
}
