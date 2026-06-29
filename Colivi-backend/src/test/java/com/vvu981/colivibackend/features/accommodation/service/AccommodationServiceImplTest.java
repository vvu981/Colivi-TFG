package com.vvu981.colivibackend.features.accommodation.service;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;
import com.vvu981.colivibackend.features.accommodation.service.Impl.AccommodationServiceImpl;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.core.storage.service.IImageStorageService;
import org.springframework.web.multipart.MultipartFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccommodationServiceImpl")
class AccommodationServiceImplTest {

    @Mock
    private AccommodationRepository accommodationRepository;

    @Mock
    private IImageStorageService imageStorageService;

    @InjectMocks
    private AccommodationServiceImpl accommodationService;

    private User owner;
    private User admin;
    private User otherUser;
    private AccommodationRequest request;
    private Accommodation accommodation;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setEmail("owner@colivi.com");
        owner.setRole(UserRole.USER);

        admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setEmail("admin@colivi.com");
        admin.setRole(UserRole.ADMIN);

        otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        otherUser.setEmail("other@colivi.com");
        otherUser.setRole(UserRole.USER);

        request = new AccommodationRequest(
                "123 Street Name",
                4,
                2,
                2,
                120,
                "Madrid",
                "Spain",
                "Madrid",
                40.4167,
                -3.7037,
                Set.of(AmenityType.WIFI, AmenityType.HEATING));

        accommodation = new Accommodation(request, owner);
        accommodation.setId(UUID.randomUUID());
    }

    @Nested
    @DisplayName("createAccommodation")
    class CreateAccommodation {

        @Test
        @DisplayName("debe guardar y retornar el alojamiento correctamente")
        void shouldCreateAccommodationSuccessfully() {
            // Arrange
            when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

            // Act
            AccommodationResponse result = accommodationService.createAccommodation(request, owner);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getAddress()).isEqualTo(request.address());
            assertThat(result.getOwnerId()).isEqualTo(owner.getId());
            verify(accommodationRepository, times(1)).save(any(Accommodation.class));
        }
    }

    @Nested
    @DisplayName("deleteAccommodationSoft")
    class DeleteAccommodationSoft {

        @Test
        @DisplayName("debe realizar borrado lógico si el usuario es el dueño")
        void shouldSoftDeleteIfUserIsOwner() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));
            when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

            // Act
            AccommodationResponse result = accommodationService.deleteAccommodationSoft(accommodation.getId(), owner);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getDeletedAt()).isNotNull();
            verify(accommodationRepository, times(1)).save(accommodation);
        }

        @Test
        @DisplayName("debe realizar borrado lógico si el usuario es un administrador")
        void shouldSoftDeleteIfUserIsAdmin() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));
            when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

            // Act
            AccommodationResponse result = accommodationService.deleteAccommodationSoft(accommodation.getId(), admin);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getDeletedAt()).isNotNull();
            verify(accommodationRepository, times(1)).save(accommodation);
        }

        @Test
        @DisplayName("debe lanzar excepción si el usuario no tiene permisos")
        void shouldThrowExceptionIfUserNotAuthorized() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));

            // Act & Assert
            assertThatThrownBy(() -> accommodationService.deleteAccommodationSoft(accommodation.getId(), otherUser))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("no puedes editar");
            verify(accommodationRepository, never()).save(any(Accommodation.class));
        }

        @Test
        @DisplayName("debe lanzar excepción si el alojamiento no existe")
        void shouldThrowExceptionIfAccommodationNotFound() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> accommodationService.deleteAccommodationSoft(UUID.randomUUID(), owner))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
            verify(accommodationRepository, never()).save(any(Accommodation.class));
        }
    }

    @Nested
    @DisplayName("deleteAccommodationHard")
    class DeleteAccommodationHard {

        @Test
        @DisplayName("debe eliminar físicamente el alojamiento si existe")
        void shouldHardDeleteSuccessfully() {
            // Arrange
            when(accommodationRepository.findById(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));

            // Act
            accommodationService.deleteAccommodationHard(accommodation.getId(), admin);

            // Assert
            verify(accommodationRepository, times(1)).delete(accommodation);
        }

        @Test
        @DisplayName("debe lanzar excepción si el alojamiento no existe al eliminar físicamente")
        void shouldThrowExceptionIfAccommodationNotFound() {
            // Arrange
            when(accommodationRepository.findById(any(UUID.class)))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> accommodationService.deleteAccommodationHard(UUID.randomUUID(), admin))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Accommodation not found");
            verify(accommodationRepository, never()).delete(any(Accommodation.class));
        }
    }

    @Nested
    @DisplayName("updateAccommodation")
    class UpdateAccommodation {

        @Test
        @DisplayName("debe actualizar los campos correctamente si el usuario es el dueño")
        void shouldUpdateSuccessfullyIfOwner() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));
            when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

            AccommodationRequest updateRequest = new AccommodationRequest(
                    "New Address",
                    5,
                    3,
                    3,
                    150,
                    "Barcelona",
                    "Spain",
                    "Barcelona",
                    41.3851,
                    2.1734,
                    Set.of(AmenityType.BALCONY));

            // Act
            AccommodationResponse result = accommodationService.updateAccommodation(accommodation.getId(), updateRequest,
                    owner);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getAddress()).isEqualTo("New Address");
            assertThat(result.getTotalRooms()).isEqualTo(5);
            assertThat(result.getAmenities()).containsExactly(AmenityType.BALCONY);
            verify(accommodationRepository, times(1)).save(accommodation);
        }

        @Test
        @DisplayName("debe lanzar excepción al actualizar si no está autorizado")
        void shouldThrowExceptionIfUserNotAuthorized() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));

            // Act & Assert
            assertThatThrownBy(
                    () -> accommodationService.updateAccommodation(accommodation.getId(), request, otherUser))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("no puedes editar");
            verify(accommodationRepository, never()).save(any(Accommodation.class));
        }

        @Test
        @DisplayName("debe actualizar correctamente si el usuario es administrador")
        void shouldUpdateSuccessfullyIfAdmin() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));
            when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

            // Act
            AccommodationResponse result = accommodationService.updateAccommodation(accommodation.getId(), request, admin);

            // Assert
            assertThat(result).isNotNull();
            verify(accommodationRepository, times(1)).save(accommodation);
        }

        @Test
        @DisplayName("debe manejar amenities null en el request de actualización")
        void shouldHandleNullAmenitiesInUpdateRequest() {
            // Arrange
            AccommodationRequest updateRequestNullAmenities = new AccommodationRequest(
                    "New Address", 5, 3, 3, 150, "Barcelona", "Spain", "Barcelona", 41.3851, 2.1734,
                    null  // amenities null
            );
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));
            when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

            // Act - no debe lanzar excepción
            AccommodationResponse result = accommodationService.updateAccommodation(
                    accommodation.getId(), updateRequestNullAmenities, owner);

            // Assert
            assertThat(result).isNotNull();
            verify(accommodationRepository, times(1)).save(accommodation);
        }

        @Test
        @DisplayName("debe lanzar excepción si el alojamiento no existe al actualizar")
        void shouldThrowExceptionIfAccommodationNotFoundOnUpdate() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(
                    () -> accommodationService.updateAccommodation(UUID.randomUUID(), request, owner))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getAccommodation")
    class GetAccommodation {

        @Test
        @DisplayName("debe retornar el alojamiento si existe")
        void shouldReturnAccommodationIfExists() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));

            // Act
            AccommodationResponse result = accommodationService.getAccommodation(accommodation.getId());

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(accommodation.getId());
        }

        @Test
        @DisplayName("debe lanzar excepción si el alojamiento no existe")
        void shouldThrowExceptionIfAccommodationNotFound() {
            // Arrange
            when(accommodationRepository.findByIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Optional.empty());

            // Act & Assert
            UUID randomId = UUID.randomUUID();
            assertThatThrownBy(() -> accommodationService.getAccommodation(randomId))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getAccommodationsCatalog")
    class GetAccommodationsCatalog {

        @Test
        @DisplayName("debe delegar la búsqueda al repositorio con los parámetros mapeados correctamente")
        void shouldCallRepositoryWithCorrectParameters() {
            // Arrange
            List<Accommodation> list = Collections.singletonList(accommodation);
            Page<Accommodation> pageResult = new PageImpl<>(list);

            when(accommodationRepository.findByFields(
                    eq(owner.getId()),
                    eq("AVAILABLE"),
                    any(Pageable.class))).thenReturn(pageResult);

            // Act
            Page<AccommodationResponse> result = accommodationService.getAccommodationsCatalog(
                    owner.getId(),
                    AccommodationVisibility.AVAILABLE,
                    0,
                    10);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(accommodationRepository, times(1)).findByFields(
                    eq(owner.getId()),
                    eq("AVAILABLE"),
                    any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("addImageToAccommodation")
    class AddImageToAccommodation {

        @Test
        @DisplayName("debe añadir una imagen correctamente si el usuario es el dueño")
        void shouldAddImageSuccessfullyIfOwner() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            accommodation.setImages(new ArrayList<>());
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));
            when(imageStorageService.uploadImage(mockFile)).thenReturn("http://example.com/image.jpg");
            when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

            // Act
            AccommodationResponse result = accommodationService.addImageToAccommodation(accommodation.getId(), mockFile, owner);

            // Assert
            assertThat(result).isNotNull();
            verify(imageStorageService, times(1)).uploadImage(mockFile);
            verify(accommodationRepository, times(1)).save(accommodation);
        }

        @Test
        @DisplayName("debe lanzar excepción al añadir imagen si el usuario no tiene permisos")
        void shouldThrowExceptionIfUserNotAuthorized() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(Optional.of(accommodation));

            // Act & Assert
            assertThatThrownBy(() -> accommodationService.addImageToAccommodation(accommodation.getId(), mockFile, otherUser))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("no tienes permiso");
            verify(imageStorageService, never()).uploadImage(any());
            verify(accommodationRepository, never()).save(any());
        }

        @Test
        @DisplayName("debe lanzar excepción si el alojamiento no existe al añadir imagen")
        void shouldThrowExceptionIfAccommodationNotFound() {
            // Arrange
            MultipartFile mockFile = mock(MultipartFile.class);
            when(accommodationRepository.findByIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> accommodationService.addImageToAccommodation(UUID.randomUUID(), mockFile, owner))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
            verify(imageStorageService, never()).uploadImage(any());
            verify(accommodationRepository, never()).save(any());
        }
    }
}
