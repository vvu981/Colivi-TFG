package com.vvu981.colivibackend.features.accommodation.service;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingStatsDTO;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.accommodation.repository.specification.ListingSpecificationBuilder;
import com.vvu981.colivibackend.features.accommodation.service.Impl.AccommodationListingServiceImpl;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccommodationListingServiceImpl")
class AccommodationListingServiceImplTest {

        @Mock
        private AccommodationListingRepository listingRepository;

        @Mock
        private ListingSpecificationBuilder specificationBuilder;

        @Mock
        private AccommodationService accommodationService;

        @Mock
        private UserRepository userRepository;

        @InjectMocks
        private AccommodationListingServiceImpl listingServiceImpl;

        private User host;
        private User admin;
        private User otherUser;
        private Accommodation accommodation;
        private AccommodationListing listing;

        @BeforeEach
        void setUp() {
                host = new User();
                host.setId(UUID.randomUUID());
                host.setNickname("hostNick");
                host.setRole(UserRole.USER);

                admin = new User();
                admin.setId(UUID.randomUUID());
                admin.setRole(UserRole.ADMIN);

                otherUser = new User();
                otherUser.setId(UUID.randomUUID());
                otherUser.setRole(UserRole.USER);

                accommodation = new Accommodation();
                accommodation.setId(UUID.randomUUID());
                accommodation.setOwner(host);

                listing = AccommodationListing.builder()
                                .id(UUID.randomUUID())
                                .accommodation(accommodation)
                                .host(host)
                                .title("Beautiful Room")
                                .description("Nice place to live")
                                .pricePerMonth(BigDecimal.valueOf(600.0))
                                .rentalType(RentalType.ENTIRE_PLACE)
                                .status(ListingStatus.AVAILABLE)
                                .createdAt(LocalDateTime.now())
                                .build();

                lenient().when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));
                lenient().when(userRepository.findActiveById(admin.getId())).thenReturn(Optional.of(admin));
                lenient().when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
                lenient().when(accommodationService.findAccommodationByIdAndDeletedAtIsNull(accommodation.getId()))
                                .thenReturn(accommodation);
        }

        @Nested
        @DisplayName("createAccommodationListing")
        class CreateAccommodationListing {

                @Test
                @DisplayName("debe crear el anuncio si el usuario actual es el propietario de la casa")
                void shouldCreateListingWhenOwner() {
                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        com.vvu981.colivibackend.features.accommodation.domain.RentalType.ENTIRE_PLACE,
                                        BigDecimal.valueOf(100), null);
                        lenient().when(userRepository.findActiveById(host.getId())).thenReturn(Optional.of(host));

                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));
                        when(listingRepository.save(any(AccommodationListing.class)))
                                        .thenAnswer(invocation -> invocation.getArgument(0));

                        AccommodationListingResponse response = listingServiceImpl.createAccommodationListing(request,
                                        host.getId());

                        assertThat(response).isNotNull();
                        assertThat(response.title()).isEqualTo("Title");
                        verify(listingRepository, times(1)).save(any(AccommodationListing.class));
                }

                @Test
                @DisplayName("debe crear el anuncio si el usuario actual es admin")
                void shouldCreateListingWhenAdmin() {
                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        com.vvu981.colivibackend.features.accommodation.domain.RentalType.ENTIRE_PLACE,
                                        BigDecimal.valueOf(100), null);

                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));
                        when(listingRepository.save(any(AccommodationListing.class)))
                                        .thenAnswer(invocation -> invocation.getArgument(0));

                        AccommodationListingResponse response = listingServiceImpl.createAccommodationListing(request,
                                        admin.getId());

                        assertThat(response).isNotNull();
                        verify(listingRepository, times(1)).save(any(AccommodationListing.class));
                }

                @Test
                @DisplayName("debe lanzar excepcion si el usuario actual no es propietario ni admin")
                void shouldThrowExceptionWhenNotOwnerNorAdmin() {
                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        com.vvu981.colivibackend.features.accommodation.domain.RentalType.ENTIRE_PLACE,
                                        BigDecimal.valueOf(100), null);

                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(accommodation.getId()))
                                        .thenReturn(accommodation);

                        assertThatThrownBy(
                                        () -> listingServiceImpl.createAccommodationListing(request, otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("No tienes permisos para publicar un anuncio");
                }

                @Test
                @DisplayName("debe lanzar excepcion si el inmueble ya esta alquilado por completo")
                void shouldThrowIfEntirePlaceAlreadyRented() {
                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        RentalType.ROOM, BigDecimal.valueOf(100), null);
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(1L, 0L));

                        assertThatThrownBy(() -> listingServiceImpl.createAccommodationListing(request, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("ya está alquilado por completo");
                }

                @Test
                @DisplayName("debe lanzar excepcion si se intenta alquilar entero pero hay habitaciones comprometidas")
                void shouldThrowIfRentingEntirePlaceButRoomsExist() {
                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        RentalType.ENTIRE_PLACE, BigDecimal.valueOf(100), null);
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 1L));

                        assertThatThrownBy(() -> listingServiceImpl.createAccommodationListing(request, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("habitaciones comprometidas");
                }

                @Test
                @DisplayName("debe lanzar excepcion si se alcanzo el limite de habitaciones")
                void shouldThrowIfRoomLimitReached() {
                        accommodation.setTotalRooms(3);
                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        RentalType.ROOM, BigDecimal.valueOf(100), null);
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 3L));

                        assertThatThrownBy(() -> listingServiceImpl.createAccommodationListing(request, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("límite de habitaciones");
                }

                @Test
                @DisplayName("debe procesar imagenes seleccionadas correctamente")
                void shouldProcessSelectedImages() {
                        com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage image1 = new com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage();
                        image1.setId(UUID.randomUUID());
                        image1.setDisplayOrder(1);
                        accommodation.setImages(List.of(image1));

                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        RentalType.ENTIRE_PLACE, BigDecimal.valueOf(100), List.of(image1.getId()));

                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));
                        when(listingRepository.save(any(AccommodationListing.class)))
                                        .thenAnswer(invocation -> invocation.getArgument(0));

                        AccommodationListingResponse response = listingServiceImpl.createAccommodationListing(request,
                                        host.getId());

                        assertThat(response).isNotNull();
                        verify(listingRepository, times(1)).save(any(AccommodationListing.class));
                }

                @Test
                @DisplayName("debe lanzar excepcion si imagen seleccionada no pertenece al alojamiento")
                void shouldThrowIfSelectedImageDoesNotBelongToAccommodation() {
                        com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage image1 = new com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage();
                        image1.setId(UUID.randomUUID());
                        accommodation.setImages(List.of(image1)); // Solo esta imagen pertenece al alojamiento

                        UUID invalidImageId = UUID.randomUUID(); // No esta en accommodation.images

                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        RentalType.ENTIRE_PLACE, BigDecimal.valueOf(100), List.of(invalidImageId));

                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));

                        assertThatThrownBy(() -> listingServiceImpl.createAccommodationListing(request, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("no pertenece a este alojamiento");
                }

                @Test
                @DisplayName("debe lanzar excepcion si la imagen no pertenece al alojamiento al crear")
                void shouldThrowIfImageNotBelongsToAccommodationCreate() {
                        AccommodationListingRequest request = new AccommodationListingRequest(
                                        accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                                        RentalType.ENTIRE_PLACE, BigDecimal.valueOf(100), List.of(UUID.randomUUID()));

                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));

                        assertThatThrownBy(() -> listingServiceImpl.createAccommodationListing(request, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("no pertenece a este alojamiento");
                }
        }

        @Nested
        @DisplayName("deleteAccommodationListingSoft")
        class DeleteAccommodationListingSoft {

                @Test
                @DisplayName("debe marcar el anuncio como borrado (soft delete) si tiene permisos")
                void shouldSoftDeleteListing() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        listingServiceImpl.deleteAccommodationListingSoft(listing.getId(), host.getId());

                        assertThat(listing.getDeletedAt()).isNotNull();
                        verify(listingRepository, times(1)).save(listing);
                }

                @Test
                @DisplayName("debe lanzar excepcion si ya esta eliminado")
                void shouldThrowIfAlreadyDeleted() {
                        listing.setDeletedAt(LocalDateTime.now());
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.deleteAccommodationListingSoft(listing.getId(),
                                        host.getId()))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("no existe o fue eliminado");
                }

                @Test
                @DisplayName("debe lanzar excepcion si no tiene permisos para borrar")
                void shouldThrowIfNoPermissionToSoftDelete() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.deleteAccommodationListingSoft(listing.getId(),
                                        otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no puedes eliminar el anuncio");
                }

                @Test
                @DisplayName("debe permitir eliminar el anuncio si el usuario es owner pero no host del anuncio")
                void shouldAllowIfOwnerButNotHost() {
                        User ownerNotHost = new User();
                        ownerNotHost.setId(accommodation.getOwner().getId()); // same owner
                        ownerNotHost.setRole(UserRole.USER);
                        lenient().when(userRepository.findActiveById(ownerNotHost.getId()))
                                        .thenReturn(Optional.of(ownerNotHost));

                        User distinctHost = new User();
                        distinctHost.setId(UUID.randomUUID());
                        listing.setHost(distinctHost); // different host

                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> listingServiceImpl
                                        .deleteAccommodationListingSoft(listing.getId(), ownerNotHost.getId()));
                }

                @Test
                @DisplayName("debe permitir eliminar el anuncio si el usuario es host pero no owner de la casa")
                void shouldAllowIfHostButNotOwner() {
                        User hostNotOwner = new User();
                        hostNotOwner.setId(listing.getHost().getId()); // same host
                        hostNotOwner.setRole(UserRole.USER);
                        lenient().when(userRepository.findActiveById(hostNotOwner.getId()))
                                        .thenReturn(Optional.of(hostNotOwner));

                        User distinctOwner = new User();
                        distinctOwner.setId(UUID.randomUUID());
                        accommodation.setOwner(distinctOwner); // different owner

                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> listingServiceImpl
                                        .deleteAccommodationListingSoft(listing.getId(), hostNotOwner.getId()));
                }
        }

        @Nested
        @DisplayName("deleteAccommodationListingHard")
        class DeleteAccommodationListingHard {

                @Test
                @DisplayName("debe eliminar de la base de datos (hard delete) si es admin")
                void shouldHardDeleteListingIfAdmin() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        listingServiceImpl.deleteAccommodationListingHard(listing.getId(), admin.getId());

                        verify(listingRepository, times(1)).delete(listing);
                }

                @Test
                @DisplayName("debe lanzar excepcion si no es admin")
                void shouldThrowIfNotAdmin() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.deleteAccommodationListingHard(listing.getId(),
                                        host.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no tienes permisos para esa accion");
                }
        }

        @Nested
        @DisplayName("updateAccommodationListing")
        class UpdateAccommodationListing {

                @Test
                @DisplayName("debe actualizar los datos del anuncio correctamente")
                void shouldUpdateListing() {
                        AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title",
                                        "New Desc",
                                        BigDecimal.valueOf(700), BigDecimal.valueOf(100), null);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(listingRepository.save(any(AccommodationListing.class)))
                                        .thenAnswer(invocation -> invocation.getArgument(0));

                        AccommodationListingResponse response = listingServiceImpl.updateAccommodationListing(
                                        listing.getId(),
                                        updateDto, host.getId());

                        assertThat(response.title()).isEqualTo("New Title");
                        assertThat(response.description()).isEqualTo("New Desc");
                        assertThat(response.pricePerMonth()).isEqualByComparingTo(BigDecimal.valueOf(700));
                }

                @Test
                @DisplayName("debe lanzar excepcion si se intenta actualizar un anuncio UNAVAILABLE")
                void shouldThrowIfUpdatingUnavailableListing() {
                        listing.setStatus(ListingStatus.UNAVAILABLE);
                        AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title",
                                        "New Desc",
                                        BigDecimal.valueOf(700), BigDecimal.valueOf(100), null);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.updateAccommodationListing(listing.getId(),
                                        updateDto, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("No se puede modificar un anuncio en estado UNAVAILABLE");
                }

                @Test
                @DisplayName("debe lanzar excepcion si no es el host o owner ni admin")
                void shouldThrowIfNoPermissionToUpdate() {
                        AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title",
                                        "New Desc",
                                        BigDecimal.valueOf(700), BigDecimal.valueOf(100), null);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(
                                        () -> listingServiceImpl.updateAccommodationListing(listing.getId(), updateDto,
                                                        otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("No tienes permiso para editar este anuncio");
                }

                @Test
                @DisplayName("debe procesar imagenes seleccionadas correctamente al actualizar")
                void shouldProcessSelectedImagesUpdate() {
                        com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage image1 = new com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage();
                        image1.setId(UUID.randomUUID());
                        image1.setDisplayOrder(1);
                        accommodation.setImages(List.of(image1));

                        AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title",
                                        "New Desc",
                                        BigDecimal.valueOf(700), BigDecimal.valueOf(100), List.of(image1.getId()));

                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService
                                        .findAccommodationWithImagesByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.save(any(AccommodationListing.class)))
                                        .thenAnswer(invocation -> invocation.getArgument(0));

                        AccommodationListingResponse response = listingServiceImpl
                                        .updateAccommodationListing(listing.getId(), updateDto, host.getId());

                        assertThat(response).isNotNull();
                        verify(listingRepository, times(1)).save(any(AccommodationListing.class));
                }

                @Test
                @DisplayName("debe lanzar excepcion si la imagen no pertenece al alojamiento al actualizar")
                void shouldThrowIfImageNotBelongsToAccommodationUpdate() {
                        AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title",
                                        "New Desc",
                                        BigDecimal.valueOf(700), BigDecimal.valueOf(100), List.of(UUID.randomUUID()));

                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService
                                        .findAccommodationWithImagesByIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(accommodation);

                        assertThatThrownBy(() -> listingServiceImpl.updateAccommodationListing(listing.getId(),
                                        updateDto, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("no pertenece a este alojamiento");
                }

                @Test
                @DisplayName("debe lanzar excepcion si se intenta actualizar con precio negativo")
                void shouldThrowIfPriceIsNegative() {
                        AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title",
                                        "New Desc",
                                        BigDecimal.valueOf(-100), BigDecimal.valueOf(100), null);

                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.updateAccommodationListing(listing.getId(),
                                        updateDto, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("El precio mensual debe ser mayor a 0");
                }
        }

        @Nested
        @DisplayName("banAccommodationListing")
        class BanAccommodationListing {

                @Test
                @DisplayName("debe banear un anuncio si es admin")
                void shouldBanListingIfAdmin() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        listingServiceImpl.banAccommodationListing(listing.getId(), admin.getId());

                        assertThat(listing.getStatus()).isEqualTo(ListingStatus.BANNED);
                        verify(listingRepository, times(1)).save(listing);
                }

                @Test
                @DisplayName("debe lanzar excepcion si ya esta baneado")
                void shouldThrowIfAlreadyBanned() {
                        listing.setStatus(ListingStatus.BANNED);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.banAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("ya está baneado");
                }

                @Test
                @DisplayName("debe lanzar excepcion si no es admin")
                void shouldThrowIfNotAdminToBan() {
                        assertThatThrownBy(
                                        () -> listingServiceImpl.banAccommodationListing(listing.getId(), host.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no tienes permisos");
                }
        }

        @Nested
        @DisplayName("unBanAccommodationListing")
        class UnBanAccommodationListing {

                @Test
                @DisplayName("debe desbanear un anuncio si es admin y estaba baneado")
                void shouldUnbanListingIfAdmin() {
                        listing.setStatus(ListingStatus.BANNED);
                        listing.setPreviousStatus(ListingStatus.AVAILABLE);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));

                        listingServiceImpl.unBanAccommodationListing(listing.getId(), admin.getId());

                        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
                        verify(listingRepository, times(1)).save(listing);
                }

                @Test
                @DisplayName("debe lanzar excepcion si no estaba baneado")
                void shouldThrowIfNotBanned() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.unBanAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("este anuncio no está baneado");
                }

                @Test
                @DisplayName("debe lanzar excepcion al intentar desbanear si no es admin")
                void shouldThrowIfNotAdminToUnban() {
                        assertThatThrownBy(() -> listingServiceImpl.unBanAccommodationListing(listing.getId(),
                                        host.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no tienes permisos");
                }

                @Test
                @DisplayName("debe lanzar excepcion si se alcanzo el limite de habitaciones al desbanear")
                void shouldThrowIfRoomLimitReachedWhenUnbanning() {
                        listing.setStatus(ListingStatus.BANNED);
                        listing.setPreviousStatus(ListingStatus.AVAILABLE);
                        listing.setRentalType(com.vvu981.colivibackend.features.accommodation.domain.RentalType.ROOM);
                        accommodation.setTotalRooms(3);

                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);

                        // Simulamos que ya hay 3 habitaciones alquiladas (sin contar la baneada porque
                        // el repo la ignora)
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 3L));

                        assertThatThrownBy(() -> listingServiceImpl.unBanAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("Se alcanzó el límite de habitaciones del inmueble");
                }
        }

        @Nested
        @DisplayName("searchListings")
        class SearchListings {

                @Test
                @DisplayName("debe buscar anuncios y devolverlos paginados")
                @SuppressWarnings("unchecked")
                void shouldSearchAndReturnPage() {
                        Map<String, String> filters = Map.of("city", "Madrid");
                        Specification<AccommodationListing> spec = mock(Specification.class);
                        Page<AccommodationListing> page = new PageImpl<>(List.of(listing));

                        when(specificationBuilder.buildSpecification(filters)).thenReturn(spec);
                        when(listingRepository.findAll(eq(spec), any(Pageable.class))).thenReturn(page);

                        Page<AccommodationListingResponse> response = listingServiceImpl.searchListings(filters, 0, 10);

                        assertThat(response).isNotNull();
                        assertThat(response.getContent()).hasSize(1);
                        assertThat(response.getContent().get(0).title()).isEqualTo("Beautiful Room");
                }
        }

        @Nested
        @DisplayName("recoverAccommodationListing")
        class RecoverAccommodationListing {

                @Test
                @DisplayName("debe restaurar un anuncio eliminado suavemente si es admin")
                void shouldRecoverListingIfAdmin() {
                        listing.setDeletedAt(LocalDateTime.now());
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));

                        AccommodationListingResponse response = listingServiceImpl.recoverAccommodationListing(
                                        listing.getId(),
                                        admin.getId());

                        assertThat(listing.getDeletedAt()).isNull();
                        assertThat(response.id()).isEqualTo(listing.getId());
                        verify(listingRepository, times(1)).save(listing);
                }

                @Test
                @DisplayName("debe lanzar excepcion si el anuncio no esta eliminado")
                void shouldThrowIfListingNotDeleted() {
                        listing.setDeletedAt(null);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("no esta eliminado");
                }

                @Test
                @DisplayName("debe lanzar excepcion si intenta recuperar y no es owner ni admin")
                void shouldThrowIfNotOwnerOrAdminToRecover() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(),
                                        otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("no tienes permisos para esta accion");
                }

                @Test
                @DisplayName("debe lanzar excepcion si el anuncio esta baneado")
                void shouldThrowIfListingIsBanned() {
                        listing.setDeletedAt(LocalDateTime.now());
                        listing.setBannedAt(LocalDateTime.now());
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("esta baneado");
                }

                @Test
                @DisplayName("debe lanzar excepcion si se paso el tiempo de recuperacion")
                void shouldThrowIfRecoveryTimePassed() {
                        listing.setDeletedAt(LocalDateTime.now().minusDays(8));
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("tiempo de recuperacion");
                }

                @Test
                @DisplayName("debe lanzar excepcion si el alojamiento padre esta eliminado")
                void shouldThrowIfRecoveringListingWithDeletedAccommodation() {
                        listing.setDeletedAt(LocalDateTime.now());
                        accommodation.setDeletedAt(LocalDateTime.now()); // Padre eliminado
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("alojamiento eliminado");
                }

                @Test
                @DisplayName("debe lanzar excepcion si recuperar supera la capacidad")
                void shouldThrowIfRecoveringExceedsCapacity() {
                        listing.setDeletedAt(LocalDateTime.now());
                        listing.setRentalType(RentalType.ROOM);
                        accommodation.setTotalRooms(3);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 3L));

                        assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("límite de habitaciones");
                }

                @Test
                @DisplayName("debe lanzar excepcion si recuperar rompe exclusion mutua")
                void shouldThrowIfRecoveringBreaksMutualExclusion() {
                        listing.setDeletedAt(LocalDateTime.now());
                        listing.setRentalType(RentalType.ENTIRE_PLACE);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 1L));

                        assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(),
                                        admin.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("habitaciones comprometidas");
                }
        }

        @Nested
        @DisplayName("getAccommodationListing")
        class GetAccommodationListing {

                @Test
                @DisplayName("debe obtener el anuncio por ID")
                void shouldGetListingById() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        AccommodationListingResponse response = listingServiceImpl
                                        .getAccommodationListing(listing.getId(), null);

                        assertThat(response).isNotNull();
                        assertThat(response.id()).isEqualTo(listing.getId());
                }

                @Test
                @DisplayName("debe lanzar excepcion si no se encuentra el anuncio")
                void shouldThrowIfNotFound() {
                        UUID randomId = UUID.randomUUID();
                        when(listingRepository.findById(randomId)).thenReturn(Optional.empty());

                        assertThatThrownBy(() -> listingServiceImpl.getAccommodationListing(randomId, null))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("no se encuentra el anuncio con id");
                }

                @Test
                @DisplayName("debe lanzar excepcion si el anuncio está eliminado lógicamente (soft deleted)")
                void shouldThrowIfListingIsSoftDeleted() {
                        listing.setDeletedAt(LocalDateTime.now());
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.getAccommodationListing(listing.getId(), null))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("no existe o fue eliminado");
                }
                
                @Test
                @DisplayName("debe lanzar excepcion si el anuncio esta baneado y el usuario no tiene permisos")
                void shouldThrowIfListingIsBannedAndNotOwner() {
                        listing.setStatus(ListingStatus.BANNED);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.getAccommodationListing(listing.getId(), otherUser.getId()))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("no se encuentra el anuncio");
                }
        }

        @Nested
        @DisplayName("searchAllListingsForAdmin")
        class SearchAllListingsForAdmin {

                @Test
                @DisplayName("debe listar todos los anuncios usando la especificacion de admin")
                void shouldListAllAdminListings() {
                        Page<AccommodationListing> page = new PageImpl<>(List.of(listing));
                        when(specificationBuilder.buildAdminSpecification(anyMap()))
                                        .thenReturn(Specification.where(null));
                        when(listingRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

                        Page<AccommodationListingResponse> response = listingServiceImpl
                                        .searchAllListingsForAdmin(Map.of(), 0, 10);

                        assertThat(response).isNotNull();
                        assertThat(response.getContent()).hasSize(1);
                }
        }

        @Nested
        @DisplayName("ChangeStatusListing")
        class ChangeStatusListingTest {

                @Test
                @DisplayName("debe cambiar el estado correctamente si tiene permisos")
                void shouldChangeStatus() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        listingServiceImpl.changeStatusListing(listing.getId(), ListingStatus.UNAVAILABLE,
                                        host.getId());

                        assertThat(listing.getStatus()).isEqualTo(ListingStatus.UNAVAILABLE);
                        verify(listingRepository, times(1)).save(listing);
                }

                @Test
                @DisplayName("debe lanzar excepcion si intenta cambiar a baneado")
                void shouldThrowIfBannedRequested() {
                        assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(),
                                        ListingStatus.BANNED, admin.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("El estado BANNED no puede establecerse");
                }

                @Test
                @DisplayName("debe lanzar excepcion si el anuncio esta baneado actualmente")
                void shouldThrowIfListingIsCurrentlyBanned() {
                        listing.setStatus(ListingStatus.BANNED);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(),
                                        ListingStatus.AVAILABLE, host.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("No puedes modificar el estado de un anuncio baneado");
                }

                @Test
                @DisplayName("debe lanzar excepcion si no tiene permisos")
                void shouldThrowIfNoPermissions() {
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(),
                                        ListingStatus.UNAVAILABLE, otherUser.getId()))
                                        .isInstanceOf(UnauthorizedActionException.class)
                                        .hasMessageContaining("No tienes permiso");
                }

                @Test
                @DisplayName("debe lanzar excepcion si ya esta en ese estado")
                void shouldThrowIfAlreadyInThatStatus() {
                        listing.setStatus(ListingStatus.UNAVAILABLE);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

                        assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(),
                                        ListingStatus.UNAVAILABLE, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("ya esta UNAVAILABLE");
                }

                @Test
                @DisplayName("debe validar capacidad y cambiar a AVAILABLE correctamente")
                void shouldChangeStatusToAvailableValidatingCapacity() {
                        listing.setStatus(ListingStatus.UNAVAILABLE);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 0L));

                        listingServiceImpl.changeStatusListing(listing.getId(), ListingStatus.AVAILABLE, host.getId());

                        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
                        verify(listingRepository, times(1)).save(listing);
                        verify(accommodationService, times(1)).findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(accommodation.getId());
                }

                @Test
                @DisplayName("debe lanzar excepcion si excede capacidad al cambiar a AVAILABLE")
                void shouldThrowIfCapacityExceededWhenChangingToAvailable() {
                        listing.setStatus(ListingStatus.UNAVAILABLE);
                        listing.setRentalType(RentalType.ROOM);
                        accommodation.setTotalRooms(1);
                        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
                        when(accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(
                                        accommodation.getId()))
                                        .thenReturn(accommodation);
                        when(listingRepository.getListingStatsForAccommodation(accommodation.getId()))
                                        .thenReturn(new AccommodationListingStatsDTO(0L, 1L)); // Ya hay 1 habitacion ocupada

                        assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(),
                                        ListingStatus.AVAILABLE, host.getId()))
                                        .isInstanceOf(BusinessRuleValidationException.class)
                                        .hasMessageContaining("límite de habitaciones");
                }
        }

        @Nested
        @DisplayName("UserFailures")
        class UserFailures {
                @Test
                @DisplayName("debe lanzar excepcion si el usuario no existe")
                void shouldThrowIfUserNotFound() {
                        UUID nonExistentId = UUID.randomUUID();
                        when(userRepository.findActiveById(nonExistentId)).thenReturn(Optional.empty());

                        assertThatThrownBy(() -> listingServiceImpl.banAccommodationListing(listing.getId(),
                                        nonExistentId))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("Usuario no encontrado");
                }
        }

        @Nested
        @DisplayName("findListingsByAccommodationId")
        class FindListingsByAccommodationId {
                @Test
                @DisplayName("debe retornar los listings por id de alojamiento")
                void shouldReturnListingsByAccommodationId() {
                        when(listingRepository.findByAccommodationIdAndDeletedAtIsNull(accommodation.getId()))
                                        .thenReturn(List.of(listing));

                        List<AccommodationListing> results = listingServiceImpl
                                        .findListingsByAccommodationId(accommodation.getId());

                        assertThat(results).hasSize(1);
                        assertThat(results.get(0).getId()).isEqualTo(listing.getId());
                }
        }
}
