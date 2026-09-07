package com.vvu981.colivibackend.features.messaging.service.validator;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("MessageAccessPolicyValidator Unit Tests")
class MessageAccessPolicyValidatorTest {

    private MessageAccessPolicyValidator validator;

    private User tenant;
    private User host;
    private User stranger;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        validator = new MessageAccessPolicyValidator();

        tenant = new User();
        tenant.setId(UUID.randomUUID());
        tenant.setEmail("tenant@example.com");

        host = new User();
        host.setId(UUID.randomUUID());
        host.setEmail("host@example.com");

        stranger = new User();
        stranger.setId(UUID.randomUUID());
        stranger.setEmail("stranger@example.com");

        conversation = Conversation.builder()
                .id(UUID.randomUUID())
                .tenant(tenant)
                .host(host)
                .build();
    }

    @Nested
    @DisplayName("validateCanSendMessage tests")
    class ValidateCanSendMessageTests {

        @Test
        @DisplayName("Lanza UnauthorizedActionException si el remitente no es participante")
        void whenSenderNotParticipant_thenThrowUnauthorized() {
            assertThatThrownBy(() -> validator.validateCanSendMessage(conversation, stranger))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("No tienes permisos para participar en esta conversación");
        }

        @Test
        @DisplayName("Lanza BusinessRuleValidationException si el remitente está suspendido")
        void whenSenderIsBanned_thenThrowException() {
            tenant.setBannedAt(LocalDateTime.now().minusDays(1));

            assertThatThrownBy(() -> validator.validateCanSendMessage(conversation, tenant))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("Tu cuenta se encuentra suspendida temporalmente");
        }

        @Test
        @DisplayName("Lanza BusinessRuleValidationException si el destinatario está suspendido (inquilino a anfitrión baneado)")
        void whenRecipientIsBanned_tenantToHost_thenThrowException() {
            host.setBannedAt(LocalDateTime.now().minusDays(1));

            assertThatThrownBy(() -> validator.validateCanSendMessage(conversation, tenant))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("El destinatario se encuentra suspendido");
        }

        @Test
        @DisplayName("Lanza BusinessRuleValidationException si el destinatario está suspendido (anfitrión a inquilino baneado)")
        void whenRecipientIsBanned_hostToTenant_thenThrowException() {
            tenant.setBannedAt(LocalDateTime.now().minusDays(1));

            assertThatThrownBy(() -> validator.validateCanSendMessage(conversation, host))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("El destinatario se encuentra suspendido");
        }

        @Test
        @DisplayName("Permite enviar mensaje si no hay reserva activa vinculada")
        void whenNoActiveBooking_thenAllow() {
            conversation.setActiveBookingRequest(null);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();
            assertThatCode(() -> validator.validateCanSendMessage(conversation, host))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Permite enviar mensaje cuando la reserva está en estado PENDING o ACCEPTED")
        void whenBookingPendingOrAccepted_thenAllow() {
            BookingRequest bookingPending = BookingRequest.builder()
                    .status(RequestStatus.PENDING)
                    .build();
            conversation.setActiveBookingRequest(bookingPending);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();

            BookingRequest bookingAccepted = BookingRequest.builder()
                    .status(RequestStatus.ACCEPTED)
                    .build();
            conversation.setActiveBookingRequest(bookingAccepted);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("CONFIRMED: Permite enviar mensaje si la estancia aún no ha concluido")
        void whenBookingConfirmed_stayNotEnded_thenAllow() {
            BookingRequest booking = BookingRequest.builder()
                    .status(RequestStatus.CONFIRMED)
                    .endDate(LocalDate.now().plusDays(10))
                    .build();
            conversation.setActiveBookingRequest(booking);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("CONFIRMED: Permite enviar mensaje si la estancia concluyó pero está dentro de los 45 días legales")
        void whenBookingConfirmed_stayEndedWithin45Days_thenAllow() {
            BookingRequest booking = BookingRequest.builder()
                    .status(RequestStatus.CONFIRMED)
                    .endDate(LocalDate.now().minusDays(20))
                    .build();
            conversation.setActiveBookingRequest(booking);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("CONFIRMED: Lanza excepción si transcurrieron más de 45 días tras concluir la estancia")
        void whenBookingConfirmed_past45Days_thenThrowException() {
            BookingRequest booking = BookingRequest.builder()
                    .status(RequestStatus.CONFIRMED)
                    .endDate(LocalDate.now().minusDays(46))
                    .build();
            conversation.setActiveBookingRequest(booking);

            assertThatThrownBy(() -> validator.validateCanSendMessage(conversation, tenant))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("El canal de comunicación ha finalizado. Han transcurrido más de 45 días");
        }

        @Test
        @DisplayName("CANCELLED: Permite enviar mensaje si no hubo transacción previa (canal abierto para renegociar)")
        void whenBookingCancelled_withoutTransaction_thenAllow() {
            BookingRequest booking = BookingRequest.builder()
                    .status(RequestStatus.CANCELLED)
                    .transactionId(null)
                    .endDate(LocalDate.now().minusDays(100))
                    .build();
            conversation.setActiveBookingRequest(booking);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("CANCELLED: Permite enviar mensaje si hubo transacción y está dentro de los 45 días")
        void whenBookingCancelled_withTransactionWithin45Days_thenAllow() {
            BookingRequest booking = BookingRequest.builder()
                    .status(RequestStatus.CANCELLED)
                    .transactionId("tx_12345")
                    .endDate(LocalDate.now().minusDays(20))
                    .build();
            conversation.setActiveBookingRequest(booking);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("CANCELLED: Lanza excepción si hubo transacción y transcurrieron más de 45 días")
        void whenBookingCancelled_withTransactionPast45Days_thenThrowException() {
            BookingRequest booking = BookingRequest.builder()
                    .status(RequestStatus.CANCELLED)
                    .transactionId("tx_12345")
                    .endDate(LocalDate.now().minusDays(46))
                    .build();
            conversation.setActiveBookingRequest(booking);

            assertThatThrownBy(() -> validator.validateCanSendMessage(conversation, tenant))
                    .isInstanceOf(BusinessRuleValidationException.class)
                    .hasMessageContaining("El canal de resolución de fianza para esta reserva cancelada ha expirado");
        }

        @Test
        @DisplayName("REJECTED o EXPIRED: Permite enviar mensaje para consulta abierta")
        void whenBookingRejectedOrExpired_thenAllow() {
            BookingRequest bookingRejected = BookingRequest.builder()
                    .status(RequestStatus.REJECTED)
                    .build();
            conversation.setActiveBookingRequest(bookingRejected);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();

            BookingRequest bookingExpired = BookingRequest.builder()
                    .status(RequestStatus.EXPIRED)
                    .build();
            conversation.setActiveBookingRequest(bookingExpired);

            assertThatCode(() -> validator.validateCanSendMessage(conversation, tenant))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("validateCanAccessConversation tests")
    class ValidateCanAccessConversationTests {

        @Test
        @DisplayName("Permite el acceso al inquilino")
        void whenUserIsTenant_thenAllow() {
            assertThatCode(() -> validator.validateCanAccessConversation(conversation, tenant.getId()))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Permite el acceso al anfitrión")
        void whenUserIsHost_thenAllow() {
            assertThatCode(() -> validator.validateCanAccessConversation(conversation, host.getId()))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Lanza UnauthorizedActionException si el usuario no participa en la conversación")
        void whenUserIsNotParticipant_thenThrowUnauthorized() {
            assertThatThrownBy(() -> validator.validateCanAccessConversation(conversation, stranger.getId()))
                    .isInstanceOf(UnauthorizedActionException.class)
                    .hasMessageContaining("Acceso denegado a la conversación");
        }
    }
}
