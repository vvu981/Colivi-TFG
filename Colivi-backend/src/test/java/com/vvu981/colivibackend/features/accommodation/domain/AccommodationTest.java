package com.vvu981.colivibackend.features.accommodation.domain;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Accommodation Entity")
class AccommodationTest {

    @Test
    @DisplayName("debe instanciar correctamente con el constructor vacío y getters/setters")
    void shouldGetAndSetAllFields() {
        Accommodation accommodation = new Accommodation();
        UUID id = UUID.randomUUID();
        User owner = new User();
        LocalDateTime now = LocalDateTime.now();
        Set<AmenityType> amenities = Set.of(AmenityType.WIFI);

        accommodation.setId(id);
        accommodation.setAddress("Test Address");
        accommodation.setTotalRooms(3);
        accommodation.setTotalBathrooms(2);
        accommodation.setFreeRooms(1);
        accommodation.setSquareMeters(80);
        accommodation.setCity("Madrid");
        accommodation.setCountry("Spain");
        accommodation.setProvince("Madrid");
        accommodation.setLatitude(40.0);
        accommodation.setLongitude(-3.0);
        accommodation.setCreatedAt(now);
        accommodation.setUpdatedAt(now);
        accommodation.setDeletedAt(now);
        accommodation.setOwner(owner);
        accommodation.setAmenities(amenities);

        assertThat(accommodation.getId()).isEqualTo(id);
        assertThat(accommodation.getAddress()).isEqualTo("Test Address");
        assertThat(accommodation.getTotalRooms()).isEqualTo(3);
        assertThat(accommodation.getTotalBathrooms()).isEqualTo(2);
        assertThat(accommodation.getFreeRooms()).isEqualTo(1);
        assertThat(accommodation.getSquareMeters()).isEqualTo(80);
        assertThat(accommodation.getCity()).isEqualTo("Madrid");
        assertThat(accommodation.getCountry()).isEqualTo("Spain");
        assertThat(accommodation.getProvince()).isEqualTo("Madrid");
        assertThat(accommodation.getLatitude()).isEqualTo(40.0);
        assertThat(accommodation.getLongitude()).isEqualTo(-3.0);
        assertThat(accommodation.getCreatedAt()).isEqualTo(now);
        assertThat(accommodation.getUpdatedAt()).isEqualTo(now);
        assertThat(accommodation.getDeletedAt()).isEqualTo(now);
        assertThat(accommodation.getOwner()).isEqualTo(owner);
        assertThat(accommodation.getAmenities()).isEqualTo(amenities);
    }

    @Test
    @DisplayName("debe instanciar correctamente a partir de un DTO y un propietario")
    void shouldInitializeFromDto() {
        User owner = new User();
        AccommodationRequest dto = new AccommodationRequest(
                "Address",
                4,
                2,
                2,
                100,
                "City",
                "Country",
                "Province",
                10.0,
                20.0,
                Set.of(AmenityType.WIFI));

        Accommodation accommodation = new Accommodation(dto, owner);

        assertThat(accommodation.getAddress()).isEqualTo("Address");
        assertThat(accommodation.getTotalRooms()).isEqualTo(4);
        assertThat(accommodation.getTotalBathrooms()).isEqualTo(2);
        assertThat(accommodation.getFreeRooms()).isEqualTo(2);
        assertThat(accommodation.getSquareMeters()).isEqualTo(100);
        assertThat(accommodation.getCity()).isEqualTo("City");
        assertThat(accommodation.getCountry()).isEqualTo("Country");
        assertThat(accommodation.getProvince()).isEqualTo("Province");
        assertThat(accommodation.getLatitude()).isEqualTo(10.0);
        assertThat(accommodation.getLongitude()).isEqualTo(20.0);
        assertThat(accommodation.getOwner()).isEqualTo(owner);
        assertThat(accommodation.getAmenities()).containsExactly(AmenityType.WIFI);
        assertThat(accommodation.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("debe construir correctamente usando el Builder")
    void shouldBuildSuccessfully() {
        User owner = new User();
        Accommodation accommodation = Accommodation.builder()
                .address("Built Address")
                .totalRooms(5)
                .owner(owner)
                .build();

        assertThat(accommodation.getAddress()).isEqualTo("Built Address");
        assertThat(accommodation.getTotalRooms()).isEqualTo(5);
        assertThat(accommodation.getOwner()).isEqualTo(owner);
        assertThat(accommodation.getAmenities()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("debe permitir configurar todos los campos en el builder para cobertura completa")
    void shouldAllowSettingAllFieldsInBuilder() {
        User owner = new User();
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        Set<AmenityType> amenities = Set.of(AmenityType.WIFI);

        Accommodation accommodation = Accommodation.builder()
                .id(id)
                .address("Built Address")
                .totalRooms(5)
                .totalBathrooms(3)
                .freeRooms(2)
                .squareMeters(120)
                .city("Madrid")
                .country("Spain")
                .province("Madrid")
                .latitude(40.0)
                .longitude(-3.0)
                .createdAt(now)
                .updatedAt(now)
                .deletedAt(now)
                .amenities(amenities)
                .owner(owner)
                .build();

        assertThat(accommodation.getId()).isEqualTo(id);
        assertThat(accommodation.getAddress()).isEqualTo("Built Address");
        assertThat(accommodation.getTotalRooms()).isEqualTo(5);
        assertThat(accommodation.getTotalBathrooms()).isEqualTo(3);
        assertThat(accommodation.getFreeRooms()).isEqualTo(2);
        assertThat(accommodation.getSquareMeters()).isEqualTo(120);
        assertThat(accommodation.getCity()).isEqualTo("Madrid");
        assertThat(accommodation.getCountry()).isEqualTo("Spain");
        assertThat(accommodation.getProvince()).isEqualTo("Madrid");
        assertThat(accommodation.getLatitude()).isEqualTo(40.0);
        assertThat(accommodation.getLongitude()).isEqualTo(-3.0);
        assertThat(accommodation.getCreatedAt()).isEqualTo(now);
        assertThat(accommodation.getUpdatedAt()).isEqualTo(now);
        assertThat(accommodation.getDeletedAt()).isEqualTo(now);
        assertThat(accommodation.getAmenities()).isEqualTo(amenities);
        assertThat(accommodation.getOwner()).isEqualTo(owner);
    }

    @Test
    @DisplayName("debe cubrir el toString generado por lombok/builder si aplica")
    void shouldCoverToString() {
        String builderToString = Accommodation.builder().toString();
        assertThat(builderToString).contains("AccommodationBuilder");
    }
}
