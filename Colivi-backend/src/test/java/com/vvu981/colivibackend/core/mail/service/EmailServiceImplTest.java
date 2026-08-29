package com.vvu981.colivibackend.core.mail.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailServiceImpl")
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@colivi.com");
        ReflectionTestUtils.setField(emailService, "reactivationSubject", "Reactiva tu cuenta en Colivi");
        ReflectionTestUtils.setField(emailService, "reactivationUrlBase", "http://localhost:3000/reactivate?token=");
        ReflectionTestUtils.setField(emailService, "bookingAcceptedSubject", "¡Tu reserva ha sido aceptada!");
        ReflectionTestUtils.setField(emailService, "bookingRejectedSubject", "Actualización sobre tu solicitud de reserva");
        ReflectionTestUtils.setField(emailService, "passwordResetSubject", "Restablece tu contraseña en Colivi");
        ReflectionTestUtils.setField(emailService, "passwordResetUrlBase", "http://localhost:3000/reset-password?token=");
    }

    @Test
    @DisplayName("debe llamar a mailSender.send con el mensaje correctamente construido")
    void shouldSendEmailWithCorrectMessage() {
        String toEmail = "usuario@example.com";
        String token = "abc123-token";

        emailService.sendReactivationEmail(toEmail, token);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getFrom()).isEqualTo("noreply@colivi.com");
        assertThat(capturedMessage.getTo()).containsExactly("usuario@example.com");
        assertThat(capturedMessage.getSubject()).isEqualTo("Reactiva tu cuenta en Colivi");
        assertThat(capturedMessage.getText()).contains("http://localhost:3000/reactivate?token=abc123-token");
    }

    @Test
    @DisplayName("el cuerpo del correo debe contener el enlace completo de reactivacion")
    void shouldIncludeFullReactivationLinkInBody() {
        String toEmail = "test@test.com";
        String token = "unique-uuid-token";

        emailService.sendReactivationEmail(toEmail, token);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        String body = messageCaptor.getValue().getText();
        assertThat(body).contains("http://localhost:3000/reactivate?token=unique-uuid-token");
        assertThat(body).contains("Colivi");
        assertThat(body).contains("24 horas");
    }

    @Test
    @DisplayName("debe enviar a la direccion de destino correcta")
    void shouldSendToCorrectRecipient() {
        String toEmail = "recipient@colivi.com";
        String token = "test-token";

        emailService.sendReactivationEmail(toEmail, token);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        assertThat(messageCaptor.getValue().getTo()).containsExactly("recipient@colivi.com");
    }

    @Test
    @DisplayName("debe enviar correo de reserva aceptada con asunto y texto correctos")
    void shouldSendBookingAcceptedEmail() {
        String toEmail = "tenant@test.com";
        String listingTitle = "Piso soleado en el centro";

        emailService.sendBookingStatusEmail(toEmail, listingTitle, true, java.time.LocalDateTime.now().plusHours(72));

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("tenant@test.com");
        assertThat(capturedMessage.getSubject()).isEqualTo("¡Tu reserva ha sido aceptada!");
        assertThat(capturedMessage.getText()).contains("ACEPTADA");
        assertThat(capturedMessage.getText()).contains("Piso soleado en el centro");
        assertThat(capturedMessage.getText()).contains("aprobado tu solicitud");
    }

    @Test
    @DisplayName("debe enviar correo de reserva rechazada con asunto y texto correctos")
    void shouldSendBookingRejectedEmail() {
        String toEmail = "tenant2@test.com";
        String listingTitle = "Habitación pequeña";

        emailService.sendBookingStatusEmail(toEmail, listingTitle, false, null);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("tenant2@test.com");
        assertThat(capturedMessage.getSubject()).isEqualTo("Actualización sobre tu solicitud de reserva");
        assertThat(capturedMessage.getText()).contains("RECHAZADA");
        assertThat(capturedMessage.getText()).contains("Habitación pequeña");
        assertThat(capturedMessage.getText()).contains("no ha podido aprobar tu solicitud");
    }

    @Test
    @DisplayName("debe enviar correo de restablecimiento de contraseña con enlace correcto")
    void shouldSendPasswordResetEmail() {
        String toEmail = "reset@test.com";
        String token = "reset-token-xyz";

        emailService.sendPasswordResetEmail(toEmail, token);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("reset@test.com");
        assertThat(capturedMessage.getSubject()).isEqualTo("Restablece tu contraseña en Colivi");
        assertThat(capturedMessage.getText()).contains("http://localhost:3000/reset-password?token=reset-token-xyz");
        assertThat(capturedMessage.getText()).contains("24 horas");
    }

    @Test
    @DisplayName("debe enviar correo de nueva solicitud de reserva al anfitrión con formato correcto")
    void shouldSendNewBookingRequestEmailToHost() {
        String toEmail = "host@test.com";
        String tenantName = "Juan Pérez";
        String listingTitle = "Habitación luminosa";
        java.time.LocalDate start = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate end = java.time.LocalDate.of(2027, 6, 30);
        String msg = "Soy estudiante de máster.";

        emailService.sendNewBookingRequestToHost(toEmail, tenantName, listingTitle, start, end, msg);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("host@test.com");
        assertThat(capturedMessage.getSubject()).contains("Habitación luminosa");
        assertThat(capturedMessage.getText()).contains("Juan Pérez");
        assertThat(capturedMessage.getText()).contains("01/09/2026");
        assertThat(capturedMessage.getText()).contains("30/06/2027");
        assertThat(capturedMessage.getText()).contains("Soy estudiante de máster.");
    }

    @Test
    @DisplayName("debe enviar correo de nueva solicitud al anfitrión cuando el mensaje es nulo o vacío")
    void shouldSendNewBookingRequestEmailToHost_WithoutMessage() {
        String toEmail = "host@test.com";
        String tenantName = "Juan Pérez";
        String listingTitle = "Habitación luminosa";
        java.time.LocalDate start = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate end = java.time.LocalDate.of(2027, 6, 30);

        emailService.sendNewBookingRequestToHost(toEmail, tenantName, listingTitle, start, end, null);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("host@test.com");
        assertThat(capturedMessage.getText()).doesNotContain("Mensaje del inquilino:");
    }

    @Test
    @DisplayName("debe enviar correo de nueva solicitud al anfitrión cuando el mensaje es solo espacios en blanco")
    void shouldSendNewBookingRequestEmailToHost_WithBlankMessage() {
        String toEmail = "host@test.com";
        String tenantName = "Juan Pérez";
        String listingTitle = "Habitación luminosa";
        java.time.LocalDate start = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate end = java.time.LocalDate.of(2027, 6, 30);

        emailService.sendNewBookingRequestToHost(toEmail, tenantName, listingTitle, start, end, "    ");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("host@test.com");
        assertThat(capturedMessage.getText()).doesNotContain("Mensaje del inquilino:");
    }

    @Test
    @DisplayName("debe enviar correo de confirmación de pago al inquilino")
    void shouldSendPaymentConfirmationToTenant() {
        String toEmail = "tenant@test.com";
        String listingTitle = "Ático en Moncloa";

        emailService.sendPaymentConfirmationToTenant(toEmail, listingTitle);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("tenant@test.com");
        assertThat(capturedMessage.getSubject()).contains("¡Pago confirmado!");
        assertThat(capturedMessage.getText()).contains("Ático en Moncloa");
        assertThat(capturedMessage.getText()).contains("CONFIRMADA");
    }

    @Test
    @DisplayName("debe enviar notificación de pago recibido al anfitrión")
    void shouldSendPaymentNotificationToLandlord() {
        String toEmail = "landlord@test.com";
        String listingTitle = "Ático en Moncloa";

        emailService.sendPaymentNotificationToLandlord(toEmail, listingTitle);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getTo()).containsExactly("landlord@test.com");
        assertThat(capturedMessage.getSubject()).contains("¡Fianza pagada!");
        assertThat(capturedMessage.getText()).contains("Ático en Moncloa");
        assertThat(capturedMessage.getText()).contains("CONFIRMADA");
    }
}
