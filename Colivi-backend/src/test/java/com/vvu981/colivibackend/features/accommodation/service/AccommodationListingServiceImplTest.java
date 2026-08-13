package com.vvu981.colivibackend.features.accommodation.service;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
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
    }

    @Nested
    @DisplayName("createAccommodationListing")
    class CreateAccommodationListing {

        @Test
        @DisplayName("debe crear el anuncio si el usuario actual es el propietario de la casa")
        void shouldCreateListingWhenOwner() {
            AccommodationListingRequest request = new AccommodationListingRequest(
                    accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                    com.vvu981.colivibackend.features.accommodation.domain.RentalType.ENTIRE_PLACE, BigDecimal.valueOf(100));
            when(accommodationService.findAccommodationByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(accommodation);
            when(listingRepository.save(any(AccommodationListing.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            AccommodationListingResponse response = listingServiceImpl.createAccommodationListing(request, host.getId());

            assertThat(response).isNotNull();
            assertThat(response.title()).isEqualTo("Title");
            verify(listingRepository, times(1)).save(any(AccommodationListing.class));
        }

        @Test
        @DisplayName("debe crear el anuncio si el usuario actual es admin")
        void shouldCreateListingWhenAdmin() {
            AccommodationListingRequest request = new AccommodationListingRequest(
                    accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                    com.vvu981.colivibackend.features.accommodation.domain.RentalType.ENTIRE_PLACE, BigDecimal.valueOf(100));
            when(accommodationService.findAccommodationByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(accommodation);
            when(listingRepository.save(any(AccommodationListing.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            AccommodationListingResponse response = listingServiceImpl.createAccommodationListing(request, admin.getId());

            assertThat(response).isNotNull();
            verify(listingRepository, times(1)).save(any(AccommodationListing.class));
        }

        @Test
        @DisplayName("debe lanzar excepcion si el usuario actual no es propietario ni admin")
        void shouldThrowExceptionWhenNotOwnerNorAdmin() {
            AccommodationListingRequest request = new AccommodationListingRequest(
                    accommodation.getId(), "Title", "Desc", BigDecimal.valueOf(500),
                    com.vvu981.colivibackend.features.accommodation.domain.RentalType.ENTIRE_PLACE, BigDecimal.valueOf(100));
            when(accommodationService.findAccommodationByIdAndDeletedAtIsNull(accommodation.getId()))
                    .thenReturn(accommodation);

            assertThatThrownBy(() -> listingServiceImpl.createAccommodationListing(request, otherUser.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("No tienes permisos para publicar un anuncio");
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

            assertThatThrownBy(() -> listingServiceImpl.deleteAccommodationListingSoft(listing.getId(), host.getId()))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("ya esta eliminado");
        }

        @Test
        @DisplayName("debe lanzar excepcion si no tiene permisos para borrar")
        void shouldThrowIfNoPermissionToSoftDelete() {
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> listingServiceImpl.deleteAccommodationListingSoft(listing.getId(), otherUser.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("no puedes eliminar el anuncio");
        }

        @Test
        @DisplayName("debe permitir eliminar el anuncio si el usuario es owner pero no host del anuncio")
        void shouldAllowIfOwnerButNotHost() {
            User ownerNotHost = new User();
            ownerNotHost.setId(accommodation.getOwner().getId()); // same owner
            ownerNotHost.setRole(UserRole.USER);
            lenient().when(userRepository.findActiveById(ownerNotHost.getId())).thenReturn(Optional.of(ownerNotHost));

            User distinctHost = new User();
            distinctHost.setId(UUID.randomUUID());
            listing.setHost(distinctHost); // different host

            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> listingServiceImpl.deleteAccommodationListingSoft(listing.getId(), ownerNotHost.getId()));
        }

        @Test
        @DisplayName("debe permitir eliminar el anuncio si el usuario es host pero no owner de la casa")
        void shouldAllowIfHostButNotOwner() {
            User hostNotOwner = new User();
            hostNotOwner.setId(listing.getHost().getId()); // same host
            hostNotOwner.setRole(UserRole.USER);
            lenient().when(userRepository.findActiveById(hostNotOwner.getId())).thenReturn(Optional.of(hostNotOwner));

            User distinctOwner = new User();
            distinctOwner.setId(UUID.randomUUID());
            accommodation.setOwner(distinctOwner); // different owner

            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> listingServiceImpl.deleteAccommodationListingSoft(listing.getId(), hostNotOwner.getId()));
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

            assertThatThrownBy(() -> listingServiceImpl.deleteAccommodationListingHard(listing.getId(), host.getId()))
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
            AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title", "New Desc",
                    BigDecimal.valueOf(700));
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
            when(listingRepository.save(any(AccommodationListing.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            AccommodationListingResponse response = listingServiceImpl.updateAccommodationListing(listing.getId(),
                    updateDto, host.getId());

            assertThat(response.title()).isEqualTo("New Title");
            assertThat(response.description()).isEqualTo("New Desc");
            assertThat(response.pricePerMonth()).isEqualByComparingTo(BigDecimal.valueOf(700));
        }

        @Test
        @DisplayName("debe lanzar excepcion si no es el host o owner ni admin")
        void shouldThrowIfNoPermissionToUpdate() {
            AccommodationListingUpdateRequest updateDto = new AccommodationListingUpdateRequest("New Title", "New Desc",
                    BigDecimal.valueOf(700));
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(
                    () -> listingServiceImpl.updateAccommodationListing(listing.getId(), updateDto, otherUser.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("No tienes permiso para editar este anuncio");
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

            assertThatThrownBy(() -> listingServiceImpl.banAccommodationListing(listing.getId(), admin.getId()))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("ya está baneado");
        }

        @Test
        @DisplayName("debe lanzar excepcion si no es admin")
        void shouldThrowIfNotAdminToBan() {
            assertThatThrownBy(() -> listingServiceImpl.banAccommodationListing(listing.getId(), host.getId()))
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

            listingServiceImpl.unBanAccommodationListing(listing.getId(), admin.getId());

            assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
            verify(listingRepository, times(1)).save(listing);
        }

        @Test
        @DisplayName("debe lanzar excepcion si no estaba baneado")
        void shouldThrowIfNotBanned() {
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> listingServiceImpl.unBanAccommodationListing(listing.getId(), admin.getId()))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("este anuncio no está baneado");
        }

        @Test
        @DisplayName("debe lanzar excepcion al intentar desbanear si no es admin")
        void shouldThrowIfNotAdminToUnban() {
            assertThatThrownBy(() -> listingServiceImpl.unBanAccommodationListing(listing.getId(), host.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("no tienes permisos");
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

            AccommodationListingResponse response = listingServiceImpl.recoverAccommodationListing(listing.getId(),
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

            assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(), admin.getId()))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("no esta eliminado");
        }

        @Test
        @DisplayName("debe lanzar excepcion si intenta recuperar y no es owner ni admin")
        void shouldThrowIfNotOwnerOrAdminToRecover() {
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(), otherUser.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("no tienes permisos para esta accion");
        }

        @Test
        @DisplayName("debe lanzar excepcion si el anuncio esta baneado")
        void shouldThrowIfListingIsBanned() {
            listing.setDeletedAt(LocalDateTime.now());
            listing.setBannedAt(LocalDateTime.now());
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(), admin.getId()))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("esta baneado");
        }

        @Test
        @DisplayName("debe lanzar excepcion si se paso el tiempo de recuperacion")
        void shouldThrowIfRecoveryTimePassed() {
            listing.setDeletedAt(LocalDateTime.now().minusDays(8));
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> listingServiceImpl.recoverAccommodationListing(listing.getId(), admin.getId()))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("tiempo de recuperacion");
        }
    }

    @Nested
    @DisplayName("getAccommodationListing")
    class GetAccommodationListing {

        @Test
        @DisplayName("debe obtener el anuncio por ID")
        void shouldGetListingById() {
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            AccommodationListingResponse response = listingServiceImpl.getAccommodationListing(listing.getId());

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(listing.getId());
        }

        @Test
        @DisplayName("debe lanzar excepcion si no se encuentra el anuncio")
        void shouldThrowIfNotFound() {
            UUID randomId = UUID.randomUUID();
            when(listingRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> listingServiceImpl.getAccommodationListing(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("no se encuentra el anuncio con id");
        }
    }

    @Nested
    @DisplayName("searchAllListingsForAdmin")
    class SearchAllListingsForAdmin {

        @Test
        @DisplayName("debe listar todos los anuncios usando la especificacion de admin")
        void shouldListAllAdminListings() {
            Page<AccommodationListing> page = new PageImpl<>(List.of(listing));
            when(specificationBuilder.buildAdminSpecification(anyMap())).thenReturn(Specification.where(null));
            when(listingRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

            Page<AccommodationListingResponse> response = listingServiceImpl.searchAllListingsForAdmin(Map.of(), 0, 10);

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

            listingServiceImpl.changeStatusListing(listing.getId(), ListingStatus.UNAVAILABLE, host.getId());

            assertThat(listing.getStatus()).isEqualTo(ListingStatus.UNAVAILABLE);
            verify(listingRepository, times(1)).save(listing);
        }

        @Test
        @DisplayName("debe lanzar excepcion si intenta cambiar a baneado")
        void shouldThrowIfBannedRequested() {
            assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(), ListingStatus.BANNED, admin.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("Donde ibas pillin");
        }

        @Test
        @DisplayName("debe lanzar excepcion si no tiene permisos")
        void shouldThrowIfNoPermissions() {
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(), ListingStatus.UNAVAILABLE, otherUser.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("No tienes permiso");
        }

        @Test
        @DisplayName("debe lanzar excepcion si ya esta en ese estado")
        void shouldThrowIfAlreadyInThatStatus() {
            listing.setStatus(ListingStatus.UNAVAILABLE);
            when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

            assertThatThrownBy(() -> listingServiceImpl.changeStatusListing(listing.getId(), ListingStatus.UNAVAILABLE, host.getId()))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("ya esta UNAVAILABLE");
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

            assertThatThrownBy(() -> listingServiceImpl.banAccommodationListing(listing.getId(), nonExistentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Usuario no encontrado");
        }
    }
}
