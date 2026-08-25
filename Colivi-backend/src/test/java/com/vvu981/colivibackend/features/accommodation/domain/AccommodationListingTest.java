package com.vvu981.colivibackend.features.accommodation.domain;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("AccommodationListing Entity")
class AccommodationListingTest {

    @Test
    @DisplayName("debe establecer createdAt y status PENDIENTE al llamar a onCreate cuando status es null")
    void shouldSetDefaultsOnCreate_WhenStatusIsNull() {
        AccommodationListing listing = new AccommodationListing();
        assertThat(listing.getStatus()).isNull();

        listing.onCreate();

        assertThat(listing.getCreatedAt()).isNotNull();
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(listing.getPreviousStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(listing.getIsPromoted()).isFalse();
    }

    @Test
    @DisplayName("debe mantener el status original si ya estaba definido antes de onCreate")
    void shouldKeepExistingStatus_WhenStatusAlreadySet() {
        AccommodationListing listing = new AccommodationListing();
        listing.setStatus(ListingStatus.AVAILABLE);
        listing.setPreviousStatus(ListingStatus.AVAILABLE);
        listing.setIsPromoted(true);

        listing.onCreate();

        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(listing.getPreviousStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(listing.getIsPromoted()).isTrue();
        assertThat(listing.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("debe cubrir getters, setters y el builder")
    void shouldCoverAllGettersSettersAndBuilder() {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        User host = new User();
        Accommodation accommodation = new Accommodation();

        AccommodationListing listing = AccommodationListing.builder()
                .id(id)
                .accommodation(accommodation)
                .host(host)
                .title("Test Title")
                .description("Test Description")
                .pricePerMonth(BigDecimal.valueOf(500.00))
                .status(ListingStatus.AVAILABLE)
                .version(1)
                .createdAt(now)
                .build();

        assertThat(listing.getId()).isEqualTo(id);
        assertThat(listing.getAccommodation()).isEqualTo(accommodation);
        assertThat(listing.getHost()).isEqualTo(host);
        assertThat(listing.getTitle()).isEqualTo("Test Title");
        assertThat(listing.getDescription()).isEqualTo("Test Description");
        assertThat(listing.getPricePerMonth()).isEqualByComparingTo(BigDecimal.valueOf(500.00));
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(listing.getVersion()).isEqualTo(1);
        assertThat(listing.getCreatedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("debe cubrir setters individuales con NoArgsConstructor")
    void shouldCoverIndividualSetters() {
        AccommodationListing listing = new AccommodationListing();
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        User host = new User();
        Accommodation accommodation = new Accommodation();

        listing.setId(id);
        listing.setAccommodation(accommodation);
        listing.setHost(host);
        listing.setTitle("Another Title");
        listing.setDescription("Another Description");
        listing.setPricePerMonth(BigDecimal.valueOf(750));
        listing.setStatus(ListingStatus.AVAILABLE);
        listing.setVersion(2);
        listing.setCreatedAt(now);

        assertThat(listing.getId()).isEqualTo(id);
        assertThat(listing.getTitle()).isEqualTo("Another Title");
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(listing.getVersion()).isEqualTo(2);
    }

    @Test
    @DisplayName("debe cubrir el toString generado por lombok/builder")
    void shouldCoverToString() {
        String builderToString = AccommodationListing.builder().toString();
        assertThat(builderToString).contains("AccommodationListingBuilder");
    }

    @Test
    @DisplayName("debe crear la entidad desde el DTO y el alojamiento fisico")
    void shouldCreateEntityFromDtoAndAccommodation() {
        User host = new User();
        Accommodation accommodation = new Accommodation();
        accommodation.setOwner(host);

        AccommodationListingRequest requestDto = new AccommodationListingRequest(
                UUID.randomUUID(), "Nice Room", "Good room", BigDecimal.valueOf(300), RentalType.ENTIRE_PLACE, BigDecimal.valueOf(50), null);

        AccommodationListing listing = new AccommodationListing(requestDto, accommodation);

        assertThat(listing.getAccommodation()).isEqualTo(accommodation);
        assertThat(listing.getHost()).isEqualTo(host);
        assertThat(listing.getTitle()).isEqualTo("Nice Room");
        assertThat(listing.getDescription()).isEqualTo("Good room");
        assertThat(listing.getPricePerMonth()).isEqualTo(BigDecimal.valueOf(300));
    }

    @Test
    @DisplayName("debe banear un anuncio si no está baneado")
    void shouldBanListing() {
        AccommodationListing listing = new AccommodationListing();
        listing.setStatus(ListingStatus.AVAILABLE);

        listing.ban();

        assertThat(listing.getStatus()).isEqualTo(ListingStatus.BANNED);
        assertThat(listing.getBannedAt()).isNotNull();
        assertThat(listing.getPreviousStatus()).isEqualTo(ListingStatus.AVAILABLE);
    }

    @Test
    @DisplayName("no debe cambiar nada si ya está baneado")
    void shouldNotBanIfAlreadyBanned() {
        AccommodationListing listing = new AccommodationListing();
        listing.setStatus(ListingStatus.BANNED);
        LocalDateTime fixedTime = LocalDateTime.now().minusDays(1);
        listing.setBannedAt(fixedTime);

        listing.ban();

        assertThat(listing.getStatus()).isEqualTo(ListingStatus.BANNED);
        assertThat(listing.getBannedAt()).isEqualTo(fixedTime);
    }

    @Test
    @DisplayName("debe desbanear un anuncio si está baneado")
    void shouldUnbanListing() {
        AccommodationListing listing = new AccommodationListing();
        listing.setStatus(ListingStatus.BANNED);
        listing.setPreviousStatus(ListingStatus.AVAILABLE);
        listing.setBannedAt(LocalDateTime.now());

        listing.unBan();

        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(listing.getBannedAt()).isNull();
    }

    @Test
    @DisplayName("no debe desbanear un anuncio si no está baneado")
    void shouldNotUnbanIfNotBanned() {
        AccommodationListing listing = new AccommodationListing();
        listing.setStatus(ListingStatus.AVAILABLE);

        listing.unBan();

        assertThat(listing.getStatus()).isEqualTo(ListingStatus.AVAILABLE);
    }

    @Test
    @DisplayName("debe actualizar updatedAt al invocar onUpdate")
    void shouldUpdateTimestampOnPreUpdate() {
        AccommodationListing listing = new AccommodationListing();
        assertThat(listing.getUpdatedAt()).isNull();

        listing.onUpdate();

        assertThat(listing.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("debe lanzar excepcion al crear si el precio es negativo o cero")
    void shouldThrowIfPriceIsInvalidOnCreate() {
        User host = new User();
        Accommodation acc = new Accommodation();
        acc.setOwner(host);

        AccommodationListingRequest requestZero = new AccommodationListingRequest(
                UUID.randomUUID(), "Title", "Desc", BigDecimal.ZERO, RentalType.ENTIRE_PLACE, BigDecimal.valueOf(1000), null);

        assertThatThrownBy(() -> new AccommodationListing(requestZero, acc))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("El precio mensual debe ser mayor a 0.");

        AccommodationListingRequest requestNegative = new AccommodationListingRequest(
                UUID.randomUUID(), "Title", "Desc", BigDecimal.valueOf(-100), RentalType.ENTIRE_PLACE, BigDecimal.valueOf(1000), null);

        assertThatThrownBy(() -> new AccommodationListing(requestNegative, acc))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("El precio mensual debe ser mayor a 0.");
    }

    @Test
    @DisplayName("debe lanzar excepcion al crear si el deposito es negativo")
    void shouldThrowIfDepositIsNegativeOnCreate() {
        User host = new User();
        Accommodation acc = new Accommodation();
        acc.setOwner(host);

        AccommodationListingRequest requestNegative = new AccommodationListingRequest(
                UUID.randomUUID(), "Title", "Desc", BigDecimal.valueOf(500), RentalType.ENTIRE_PLACE, BigDecimal.valueOf(-100), null);

        assertThatThrownBy(() -> new AccommodationListing(requestNegative, acc))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("El depósito de seguridad no puede ser negativo.");
    }

    @Test
    @DisplayName("debe actualizar informacion correctamente cuando los datos son validos")
    void shouldUpdateInformationSuccessfully() {
        AccommodationListing listing = new AccommodationListing();
        listing.setStatus(ListingStatus.AVAILABLE);

        listing.updateInformation("New Title", "New Desc", BigDecimal.valueOf(600), BigDecimal.valueOf(200));

        assertThat(listing.getTitle()).isEqualTo("New Title");
        assertThat(listing.getDescription()).isEqualTo("New Desc");
        assertThat(listing.getPricePerMonth()).isEqualByComparingTo(BigDecimal.valueOf(600));
        assertThat(listing.getSecurityDeposit()).isEqualByComparingTo(BigDecimal.valueOf(200));
    }

    @Test
    @DisplayName("debe fallar al actualizar informacion si esta eliminado o en estado invalido")
    void shouldFailUpdateInformationWhenDeletedOrInvalidStatus() {
        AccommodationListing deletedListing = new AccommodationListing();
        deletedListing.setDeletedAt(LocalDateTime.now());
        assertThatThrownBy(() -> deletedListing.updateInformation("T", "D", BigDecimal.valueOf(100), BigDecimal.ZERO))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("eliminado");

        AccommodationListing bannedListing = new AccommodationListing();
        bannedListing.setStatus(ListingStatus.BANNED);
        assertThatThrownBy(() -> bannedListing.updateInformation("T", "D", BigDecimal.valueOf(100), BigDecimal.ZERO))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("BANNED");

        AccommodationListing unavailableListing = new AccommodationListing();
        unavailableListing.setStatus(ListingStatus.UNAVAILABLE);
        assertThatThrownBy(() -> unavailableListing.updateInformation("T", "D", BigDecimal.valueOf(100), BigDecimal.ZERO))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("UNAVAILABLE");
    }

    @Test
    @DisplayName("debe fallar al actualizar informacion con precios o fianzas nulos o invalidos")
    void shouldFailUpdateInformationWithInvalidPrices() {
        AccommodationListing listing = new AccommodationListing();
        listing.setStatus(ListingStatus.AVAILABLE);

        assertThatThrownBy(() -> listing.updateInformation("T", "D", null, BigDecimal.ZERO))
                .isInstanceOf(BusinessRuleValidationException.class);
        assertThatThrownBy(() -> listing.updateInformation("T", "D", BigDecimal.valueOf(-10), BigDecimal.ZERO))
                .isInstanceOf(BusinessRuleValidationException.class);
        assertThatThrownBy(() -> listing.updateInformation("T", "D", BigDecimal.valueOf(100), null))
                .isInstanceOf(BusinessRuleValidationException.class);
        assertThatThrownBy(() -> listing.updateInformation("T", "D", BigDecimal.valueOf(100), BigDecimal.valueOf(-1)))
                .isInstanceOf(BusinessRuleValidationException.class);
    }

    @Test
    @DisplayName("debe actualizar y sincronizar lista de imagenes preservando y reordenando")
    void shouldUpdateAndSyncImages() {
        AccommodationListing listing = new AccommodationListing();
        listing.setImages(new java.util.ArrayList<>());

        AccommodationImage img1 = AccommodationImage.builder().id(UUID.randomUUID()).build();
        AccommodationImage img2 = AccommodationImage.builder().id(UUID.randomUUID()).build();
        AccommodationImage img3 = AccommodationImage.builder().id(UUID.randomUUID()).build();

        // 1. Add img1 and img2
        listing.updateImages(java.util.List.of(img1, img2));
        assertThat(listing.getImages()).hasSize(2);
        assertThat(listing.getImages().get(0).getImage().getId()).isEqualTo(img1.getId());
        assertThat(listing.getImages().get(0).getDisplayOrder()).isEqualTo(1);
        assertThat(listing.getImages().get(1).getDisplayOrder()).isEqualTo(2);

        // 2. Reorder (img2 first) and swap img1 with img3
        listing.updateImages(java.util.List.of(img2, img3));
        assertThat(listing.getImages()).hasSize(2);
        assertThat(listing.getImages().get(0).getImage().getId()).isEqualTo(img2.getId());
        assertThat(listing.getImages().get(0).getDisplayOrder()).isEqualTo(1);
        assertThat(listing.getImages().get(1).getImage().getId()).isEqualTo(img3.getId());
        assertThat(listing.getImages().get(1).getDisplayOrder()).isEqualTo(2);
    }
}
