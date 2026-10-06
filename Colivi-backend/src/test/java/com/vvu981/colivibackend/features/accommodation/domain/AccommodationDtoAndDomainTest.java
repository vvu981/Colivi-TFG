package com.vvu981.colivibackend.features.accommodation.domain;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AccommodationDtoAndDomainTest {

    @Test
    @DisplayName("debe manejar correctamente valores nulos en el constructor de AccommodationResponse")
    void testAccommodationResponseConstructorNulls() {
        // Caso 1: Accommodation nulo
        AccommodationResponse responseNull = new AccommodationResponse((Accommodation) null);
        assertNull(responseNull.id());

        // Caso 2: Accommodation con propiedades internas nulas
        Accommodation accommodation = new Accommodation();
        accommodation.setAmenities(null);
        accommodation.setOwner(null);
        accommodation.setImages(null);

        AccommodationResponse response = new AccommodationResponse(accommodation);
        assertNotNull(response.amenities());
        assertTrue(response.amenities().isEmpty());
        assertNull(response.ownerId());
        assertNotNull(response.images());
        assertTrue(response.images().isEmpty());
    }

    @Test
    @DisplayName("debe manejar amenities nulas en el constructor de Accommodation")
    void testAccommodationConstructorNullAmenities() {
        AccommodationRequest request = new AccommodationRequest(
                "Address", 3, 2, 1, 80, "City", "Country", "Province", 40.0, -3.0, null);
        User owner = new User();
        Accommodation accommodation = new Accommodation(request, owner);

        assertNotNull(accommodation.getAmenities());
        assertTrue(accommodation.getAmenities().isEmpty());
    }
}
