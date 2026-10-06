package com.vvu981.colivibackend.features.bookingRequests.domain;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestDto;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("BookingRequest Domain Unit Tests")
class BookingRequestDomainTest {

    @Test
    @DisplayName("Constructor con DTO inicializa correctamente todos los campos y status PENDING")
    void testConstructorWithDto() {
        User requester = new User();
        requester.setId(UUID.randomUUID());

        AccommodationListing listing = new AccommodationListing();
        listing.setId(UUID.randomUUID());

        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = LocalDate.now().plusMonths(6);
        BookingRequestDto dto = new BookingRequestDto(listing.getId(), start, end, "Hola, me interesa");

        BookingRequest request = new BookingRequest(dto, requester, listing);

        assertThat(request.getRequester()).isEqualTo(requester);
        assertThat(request.getAccommodationListing()).isEqualTo(listing);
        assertThat(request.getStartDate()).isEqualTo(start);
        assertThat(request.getEndDate()).isEqualTo(end);
        assertThat(request.getMessage()).isEqualTo("Hola, me interesa");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.PENDING);
    }

    @Test
    @DisplayName("accept() cambia estado a ACCEPTED y asigna fecha límite de expiración")
    void testAccept_Success() {
        BookingRequest request = BookingRequest.builder()
                .status(RequestStatus.PENDING)
                .build();

        request.accept();

        assertThat(request.getStatus()).isEqualTo(RequestStatus.ACCEPTED);
        assertThat(request.getExpiresAt()).isNotNull();
        assertThat(request.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("accept() lanza IllegalStateException si la solicitud no está PENDING")
    void testAccept_InvalidStatus() {
        BookingRequest request = BookingRequest.builder()
                .status(RequestStatus.REJECTED)
                .build();

        assertThatThrownBy(request::accept)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Solo se pueden aceptar solicitudes pendientes");
    }

    @Test
    @DisplayName("reject() cambia estado a REJECTED")
    void testReject_Success() {
        BookingRequest request = BookingRequest.builder()
                .status(RequestStatus.PENDING)
                .build();

        request.reject();

        assertThat(request.getStatus()).isEqualTo(RequestStatus.REJECTED);
    }

    @Test
    @DisplayName("reject() lanza IllegalStateException si la solicitud no está PENDING")
    void testReject_InvalidStatus() {
        BookingRequest request = BookingRequest.builder()
                .status(RequestStatus.ACCEPTED)
                .build();

        assertThatThrownBy(request::reject)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Solo se pueden rechazar solicitudes pendientes");
    }

    @Test
    @DisplayName("cancel() permite cancelar desde PENDING y desde ACCEPTED")
    void testCancel_Success() {
        BookingRequest req1 = BookingRequest.builder().status(RequestStatus.PENDING).build();
        req1.cancel();
        assertThat(req1.getStatus()).isEqualTo(RequestStatus.CANCELLED);

        BookingRequest req2 = BookingRequest.builder().status(RequestStatus.ACCEPTED).build();
        req2.cancel();
        assertThat(req2.getStatus()).isEqualTo(RequestStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancel() lanza IllegalStateException desde estados terminales")
    void testCancel_InvalidStatus() {
        BookingRequest request = BookingRequest.builder().status(RequestStatus.CONFIRMED).build();

        assertThatThrownBy(request::cancel)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Solo se pueden cancelar solicitudes pendientes o aceptadas");
    }

    @Test
    @DisplayName("confirm() cambia estado a CONFIRMED y guarda datos de transacción")
    void testConfirm_Success() {
        BookingRequest request = BookingRequest.builder().status(RequestStatus.ACCEPTED).build();

        request.confirm("tx-12345", "STRIPE_CARD");

        assertThat(request.getStatus()).isEqualTo(RequestStatus.CONFIRMED);
        assertThat(request.getTransactionId()).isEqualTo("tx-12345");
        assertThat(request.getPaymentMethod()).isEqualTo("STRIPE_CARD");
    }

    @Test
    @DisplayName("confirm() lanza IllegalStateException si la solicitud no estaba ACCEPTED")
    void testConfirm_InvalidStatus() {
        BookingRequest request = BookingRequest.builder().status(RequestStatus.PENDING).build();

        assertThatThrownBy(() -> request.confirm("tx-12345", "STRIPE_CARD"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Solo se pueden confirmar solicitudes aceptadas previamente");
    }

    @Test
    @DisplayName("expire() cambia estado a EXPIRED desde ACCEPTED")
    void testExpire_Success() {
        BookingRequest request = BookingRequest.builder().status(RequestStatus.ACCEPTED).build();

        request.expire();

        assertThat(request.getStatus()).isEqualTo(RequestStatus.EXPIRED);
    }

    @Test
    @DisplayName("expire() lanza IllegalStateException si la solicitud no estaba ACCEPTED")
    void testExpire_InvalidStatus() {
        BookingRequest request = BookingRequest.builder().status(RequestStatus.PENDING).build();

        assertThatThrownBy(request::expire)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Solo se pueden caducar solicitudes que estén en estado ACCEPTED");
    }

    @Test
    @DisplayName("onUpdate() actualiza updatedAt correctamente")
    void testOnUpdate() {
        BookingRequest request = new BookingRequest();
        request.onUpdate();
        assertThat(request.getUpdatedAt()).isNotNull();
    }
}
