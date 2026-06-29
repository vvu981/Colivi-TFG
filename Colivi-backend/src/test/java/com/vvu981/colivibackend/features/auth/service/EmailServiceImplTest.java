package com.vvu981.colivibackend.features.auth.service;

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
}