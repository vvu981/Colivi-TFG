package com.vvu981.colivibackend.features.accommodation.service;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationImageOrderRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingStatsDTO;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationImageRepository;
import com.vvu981.colivibackend.features.accommodation.service.Impl.AccommodationServiceImpl;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
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
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;

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

        @Mock
        private AccommodationImageRepository accommodationImageRepository;

        @Mock
        private AccommodationListingService listingService;

        @Mock
        private UserRepository userRepository;

        @InjectMocks
        private AccommodationServiceImpl accommodationService;

        private User owner;
        private User admin;
        private User otherUser;
        private AccommodationRequest request;
        private Accommodation accommodation;

        @org.junit.jupiter.api.AfterEach
        void tearDown() {
                if (TransactionSynchronizationManager.isSynchronizationActive()) {
                        TransactionSynchronizationManager.clear();
                }
        }

        @BeforeEach
        void setUp() {
                if (!TransactionSynchronizationManager.isSynchronizationActive()) {
                        TransactionSynchronizationManager.initSynchronization();
                }

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
                accommodation.setImages(new ArrayList<>());

                lenient().when(userRepository.findActiveById(owner.getId())).thenReturn(Optional.of(owner));
                lenient().when(userRepository.findActiveById(admin.getId())).thenReturn(Optional.of(admin));
                lenient().when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
                lenient().when(userRepository.getReferenceById(owner.getId())).thenReturn(owner);
                lenient().when(userRepository.getReferenceById(admin.getId())).thenReturn(admin);
                lenient().when(userRepository.getReferenceById(otherUser.getId())).thenReturn(otherUser);
                lenient().when(listingService.getListingStatsForAccommodation(accommodation.getId())).thenReturn(new AccommodationListingStatsDTO(0L, 0L));
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
                        AccommodationResponse result = accommodationService.createAccommodation(request, owner.getId());

                        // Assert
                        assertThat(result).isNotNull();
                        assertThat(result.address()).isEqualTo(request.address());
                        assertThat(result.ownerId()).isEqualTo(owner.getId());
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
                        AccommodationResponse result = accommodationService
                                        .deleteAccommodationSoft(accommodation.getId(), owner.getId());

                        // Assert
                        assertThat(result).isNotNull();
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
                        AccommodationResponse result = accommodationService
                                        .deleteAccommodationSoft(accommodation.getId(), admin.getId());

                        // Assert
                        assertThat(result).isNotNull();
                        verify(accommodationRepository, times(1)).save(accommodation);
                }

                @Test
                @DisplayName("debe lanzar excepción si el usuario no tiene permisos")
                void shouldThrowExceptionIfUserNotAuthorized() {
                        // Arrange
                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));

                        // Act & Assert
                        assertThatThrownBy(() -> accommodationService.deleteAccommodationSoft(accommodation.getId(),
                                        otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
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
                        assertThatThrownBy(() -> accommodationService.deleteAccommodationSoft(UUID.randomUUID(),
                                        owner.getId()))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("not found");
                        verify(accommodationRepository, never()).save(any(Accommodation.class));
                }

                @Test
                @DisplayName("debe lanzar excepcion si el usuario actual no existe")
                void shouldThrowExceptionIfUserDoesNotExist() {
                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        UUID nonExistentUserId = UUID.randomUUID();
                        when(userRepository.findActiveById(nonExistentUserId)).thenReturn(Optional.empty());

                        assertThatThrownBy(() -> accommodationService.deleteAccommodationSoft(accommodation.getId(),
                                        nonExistentUserId))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("Usuario no encontrado");
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

                        AccommodationListing mockListing = new AccommodationListing();
                        mockListing.setId(UUID.randomUUID());
                        when(listingService.findListingsByAccommodationId(accommodation.getId()))
                                        .thenReturn(List.of(mockListing));

                        // Act
                        accommodationService.deleteAccommodationHard(accommodation.getId(), admin.getId());

                        // Assert
                        verify(accommodationRepository, times(1)).delete(accommodation);
                        verify(listingService, times(1)).deleteAccommodationListingHard(mockListing.getId(),
                                        admin.getId());
                }

                @Test
                @DisplayName("debe lanzar excepción si el alojamiento no existe al eliminar físicamente")
                void shouldThrowExceptionIfAccommodationNotFound() {
                        // Arrange
                        when(accommodationRepository.findById(any(UUID.class)))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(() -> accommodationService.deleteAccommodationHard(UUID.randomUUID(),
                                        admin.getId()))
                                        .isInstanceOf(ResourceNotFoundException.class)
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
                        when(accommodationRepository.findByIdAndDeletedAtIsNullWithPessimisticLock(accommodation.getId()))
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
                        AccommodationResponse result = accommodationService.updateAccommodation(accommodation.getId(),
                                        updateRequest,
                                        owner.getId());

                        // Assert
                        assertThat(result).isNotNull();
                        assertThat(result.address()).isEqualTo("New Address");
                        assertThat(result.totalRooms()).isEqualTo(5);
                        assertThat(result.amenities()).containsExactly(AmenityType.BALCONY);
                        verify(accommodationRepository, times(1)).save(accommodation);
                }

                @Test
                @DisplayName("debe lanzar excepción al actualizar si no está autorizado")
                void shouldThrowExceptionIfUserNotAuthorized() {
                        // Arrange
                        when(accommodationRepository.findByIdAndDeletedAtIsNullWithPessimisticLock(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));

                        // Act & Assert
                        assertThatThrownBy(
                                        () -> accommodationService.updateAccommodation(accommodation.getId(), request,
                                                        otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no puedes editar");
                        verify(accommodationRepository, never()).save(any(Accommodation.class));
                }

                @Test
                @DisplayName("debe actualizar correctamente si el usuario es administrador")
                void shouldUpdateSuccessfullyIfAdmin() {
                        // Arrange
                        when(accommodationRepository.findByIdAndDeletedAtIsNullWithPessimisticLock(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

                        // Act
                        AccommodationResponse result = accommodationService.updateAccommodation(accommodation.getId(),
                                        request, admin.getId());

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
                                        null // amenities null
                        );
                        when(accommodationRepository.findByIdAndDeletedAtIsNullWithPessimisticLock(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        when(accommodationRepository.save(any(Accommodation.class))).thenReturn(accommodation);

                        // Act - no debe lanzar excepción
                        AccommodationResponse result = accommodationService.updateAccommodation(
                                        accommodation.getId(), updateRequestNullAmenities, owner.getId());

                        // Assert
                        assertThat(result).isNotNull();
                        verify(accommodationRepository, times(1)).save(accommodation);
                }

                @Test
                @DisplayName("debe lanzar excepción si el alojamiento no existe al actualizar")
                void shouldThrowExceptionIfAccommodationNotFoundOnUpdate() {
                        // Arrange
                        when(accommodationRepository.findByIdAndDeletedAtIsNullWithPessimisticLock(any(UUID.class)))
                                        .thenReturn(Optional.empty());

                        // Act & Assert
                        assertThatThrownBy(
                                        () -> accommodationService.updateAccommodation(UUID.randomUUID(), request,
                                                        owner.getId()))
                                        .isInstanceOf(ResourceNotFoundException.class)
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
                        assertThat(result.id()).isEqualTo(accommodation.getId());
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
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("not found");
                }
        }

        @Nested
        @DisplayName("getMyAccommodations")
        class GetMyAccommodations {

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
                        Page<AccommodationResponse> result = accommodationService.getMyAccommodations(
                                        owner.getId(),
                                        AccommodationVisibility.AVAILABLE,
                                        0,
                                        10,
                                        owner.getId());

                        // Assert
                        assertThat(result).isNotNull();
                        assertThat(result.getContent()).hasSize(1);
                        verify(accommodationRepository, times(1)).findByFields(
                                        eq(owner.getId()),
                                        eq("AVAILABLE"),
                                        any(Pageable.class));
                }

                @Test
                @DisplayName("debe buscar usando ownerId si el usuario es ADMIN")
                void shouldSearchUsingOwnerIdIfAdmin() {
                        List<Accommodation> list = Collections.singletonList(accommodation);
                        Page<Accommodation> pageResult = new PageImpl<>(list);

                        UUID specificOwnerId = UUID.randomUUID();
                        when(accommodationRepository.findByFields(
                                        eq(specificOwnerId),
                                        eq("AVAILABLE"),
                                        any(Pageable.class))).thenReturn(pageResult);

                        Page<AccommodationResponse> result = accommodationService.getMyAccommodations(
                                        specificOwnerId,
                                        AccommodationVisibility.AVAILABLE,
                                        0,
                                        10,
                                        admin.getId());

                        assertThat(result).isNotNull();
                        verify(accommodationRepository, times(1)).findByFields(
                                        eq(specificOwnerId),
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
                        AccommodationResponse result = accommodationService
                                        .addImageToAccommodation(accommodation.getId(), mockFile, owner.getId());

                        // Assert
                        assertThat(result).isNotNull();
                        // verify(imageStorageService, times(1)).uploadImage(mockFile); // Sync handles
                        // this
                        verify(accommodationRepository, times(1)).save(accommodation);

                        // Trigger TransactionSynchronization rollback hook manually
                        List<org.springframework.transaction.support.TransactionSynchronization> syncs = TransactionSynchronizationManager
                                        .getSynchronizations();
                        assertThat(syncs).isNotEmpty();
                        syncs.get(0).afterCompletion(
                                        org.springframework.transaction.support.TransactionSynchronization.STATUS_ROLLED_BACK);
                        verify(imageStorageService, times(1)).deleteImage("http://example.com/image.jpg");
                }

                @Test
                @DisplayName("debe lanzar excepción al añadir imagen si el usuario no tiene permisos")
                void shouldThrowExceptionIfUserNotAuthorized() {
                        // Arrange
                        MultipartFile mockFile = mock(MultipartFile.class);
                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));

                        // Act & Assert
                        assertThatThrownBy(() -> accommodationService.addImageToAccommodation(accommodation.getId(),
                                        mockFile, otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
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
                        assertThatThrownBy(() -> accommodationService.addImageToAccommodation(UUID.randomUUID(),
                                        mockFile, owner.getId()))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("not found");
                        verify(imageStorageService, never()).uploadImage(any());
                        verify(accommodationRepository, never()).save(any());
                }
        }

        @Nested
        @DisplayName("removeImageFromAccommodation")
        class RemoveImageFromAccommodation {

                @Test
                @DisplayName("debe eliminar una imagen del alojamiento correctamente")
                void shouldRemoveImageSuccessfully() {
                        // Arrange
                        AccommodationImage image = new AccommodationImage();
                        image.setId(UUID.randomUUID());
                        image.setImageUrl("http://secure-url.com/img.png");
                        image.setAccommodation(accommodation);
                        accommodation.getImages().add(image);

                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        when(accommodationImageRepository.findById(image.getId()))
                                        .thenReturn(Optional.of(image));

                        // Act
                        accommodationService.removeImageFromAccommodation(accommodation.getId(), image.getId(),
                                        owner.getId());

                        // Assert
                        assertThat(accommodation.getImages()).doesNotContain(image);
                        // verify(imageStorageService,
                        // times(1)).deleteImage("http://secure-url.com/img.png"); // Sync handles this
                        verify(accommodationRepository, times(1)).save(accommodation);

                        // Trigger TransactionSynchronization commit hook manually
                        List<org.springframework.transaction.support.TransactionSynchronization> syncs = TransactionSynchronizationManager
                                        .getSynchronizations();
                        assertThat(syncs).isNotEmpty();
                        syncs.get(0).afterCommit();
                        verify(imageStorageService, times(1)).deleteImage("http://secure-url.com/img.png");
                }

                @Test
                @DisplayName("debe permitir a un ADMIN eliminar la imagen aunque no sea owner")
                void shouldAllowAdminToRemoveImage() {
                        AccommodationImage image = new AccommodationImage();
                        image.setId(UUID.randomUUID());
                        image.setImageUrl("http://secure-url.com/img.png");
                        image.setAccommodation(accommodation);
                        accommodation.getImages().add(image);

                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        when(accommodationImageRepository.findById(image.getId()))
                                        .thenReturn(Optional.of(image));

                        accommodationService.removeImageFromAccommodation(accommodation.getId(), image.getId(),
                                        admin.getId());

                        assertThat(accommodation.getImages()).doesNotContain(image);
                        // verify(imageStorageService,
                        // times(1)).deleteImage("http://secure-url.com/img.png"); // Sync handles this
                }

                @Test
                @DisplayName("debe lanzar excepcion si el usuario no tiene permisos")
                void shouldThrowIfNotAuthorizedToRemove() {
                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));

                        assertThatThrownBy(() -> accommodationService.removeImageFromAccommodation(
                                        accommodation.getId(), UUID.randomUUID(), otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no tienes permiso");
                }

                @Test
                @DisplayName("debe lanzar excepcion si la imagen no existe")
                void shouldThrowIfImageNotFound() {
                        UUID imgId = UUID.randomUUID();
                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        when(accommodationImageRepository.findById(imgId))
                                        .thenReturn(Optional.empty());

                        assertThatThrownBy(() -> accommodationService
                                        .removeImageFromAccommodation(accommodation.getId(), imgId, owner.getId()))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("no se ha podido obtener la imagen");
                }

                @Test
                @DisplayName("debe lanzar excepcion si la imagen no pertenece al alojamiento")
                void shouldThrowIfImageDoesNotBelongToAccommodation() {
                        Accommodation otherAcc = new Accommodation();
                        otherAcc.setId(UUID.randomUUID());

                        AccommodationImage image = new AccommodationImage();
                        image.setId(UUID.randomUUID());
                        image.setAccommodation(otherAcc);

                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        when(accommodationImageRepository.findById(image.getId()))
                                        .thenReturn(Optional.of(image));

                        assertThatThrownBy(() -> accommodationService
                                        .removeImageFromAccommodation(accommodation.getId(), image.getId(),
                                                        owner.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("La imagen no pertenece al alojamiento especificado");
                }
        }

        @Nested
        @DisplayName("updateImagesOrder")
        class UpdateImagesOrder {

                @Test
                @DisplayName("debe actualizar el orden de las imagenes correctamente")
                void shouldUpdateImagesOrderSuccessfully() {
                        AccommodationImage img1 = new AccommodationImage();
                        img1.setId(UUID.randomUUID());
                        img1.setDisplayOrder(1);

                        AccommodationImage img2 = new AccommodationImage();
                        img2.setId(UUID.randomUUID());
                        img2.setDisplayOrder(2);

                        accommodation.getImages().addAll(List.of(img1, img2));

                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));
                        when(accommodationRepository.save(accommodation)).thenReturn(accommodation);

                        List<AccommodationImageOrderRequest> orderRequests = List.of(
                                        new AccommodationImageOrderRequest(img1.getId(), 2),
                                        new AccommodationImageOrderRequest(img2.getId(), 1));

                        AccommodationResponse response = accommodationService.updateImagesOrder(accommodation.getId(),
                                        orderRequests, owner.getId());

                        assertThat(response).isNotNull();
                        assertThat(img1.getDisplayOrder()).isEqualTo(2);
                        assertThat(img2.getDisplayOrder()).isEqualTo(1);
                }

                @Test
                @DisplayName("debe lanzar excepcion al reordenar si no esta autorizado")
                void shouldThrowIfNotAuthorizedToReorder() {
                        when(accommodationRepository.findByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(Optional.of(accommodation));

                        assertThatThrownBy(() -> accommodationService.updateImagesOrder(accommodation.getId(),
                                        List.of(), otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no tienes permiso");
                }
        }
}
