package com.vvu981.colivibackend.features.accommodation.domain;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

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
                UUID.randomUUID(), "Nice Room", "Good room", BigDecimal.valueOf(300), RentalType.ENTIRE_PLACE, BigDecimal.valueOf(50));

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
}
