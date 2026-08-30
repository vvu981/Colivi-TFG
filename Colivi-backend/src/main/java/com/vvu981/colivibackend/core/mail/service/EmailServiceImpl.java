package com.vvu981.colivibackend.core.mail.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Implementación concreta de {@link EmailService} basada en el componente
 * nativo {@link JavaMailSender} de Spring.
 *
 * <p>Esta clase cumple con el principio de Responsabilidad Única (SRP):
 * su única responsabilidad es construir y despachar correos electrónicos
 * a través del servidor SMTP configurado (Mailpit en local, SMTP real en producción).</p>
 *
 * <p>La inyección de dependencias se realiza por constructor gracias a
 * {@code @RequiredArgsConstructor} de Lombok, garantizando inmutabilidad
 * y facilitando el testing unitario mediante mocks.</p>
 *
 * <p>Los valores sensibles o configurables (remitente, URL de frontend) se
 * leen de {@code application.properties} mediante {@code @Value}, que a su vez
 * los resuelve desde variables de entorno. No existen valores hardcodeados.</p>
 */
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    // ─── Dependencias ─────────────────────────────────────────────────────────

    /**
     * Cliente de correo de Spring. El bean es provisto automáticamente por
     * {@code spring-boot-starter-mail} una vez configuradas las propiedades
     * {@code spring.mail.*} en {@code application.properties}.
     */
    private final JavaMailSender mailSender;

    // ─── Configuración inyectada desde application.properties (→ .env) ────────

    /**
     * Dirección remitente del correo electrónico.
     * Resuelto desde la variable de entorno {@code MAIL_FROM},
     * con fallback a {@code noreply@colivi.com} para desarrollo local.
     */
    @Value("${app.mail.from}")
    private String fromAddress;

    /**
     * Asunto fijo del correo de reactivación.
     * Definido en {@code application.properties} bajo {@code app.mail.reactivation-subject}.
     */
    @Value("${app.mail.reactivation-subject}")
    private String reactivationSubject;

    /**
     * URL base del frontend de Next.js donde el usuario completará la reactivación.
     * Resuelto desde la variable de entorno {@code MAIL_REACTIVATION_URL},
     * con fallback a {@code http://localhost:3000/reactivate?token=} para dev local.
     */
    @Value("${app.mail.reactivation-url}")
    private String reactivationUrlBase;

    @Value("${app.mail.booking-accepted-subject}")
    private String bookingAcceptedSubject;

    @Value("${app.mail.booking-rejected-subject}")
    private String bookingRejectedSubject;

    @Value("${app.mail.password-reset-subject}")
    private String passwordResetSubject;

    @Value("${app.mail.password-reset-url}")
    private String passwordResetUrlBase;

    @Value("${app.mail.received-requests-url}")
    private String receivedRequestsUrlBase;

    // ─── Implementación de la interfaz ────────────────────────────────────────

    /**
     * {@inheritDoc}
     *
     * <p>Construye un {@link SimpleMailMessage} con el destinatario, asunto y
     * cuerpo del mensaje, y lo delega a {@link JavaMailSender#send} para
     * su envío a través del servidor SMTP configurado.</p>
     *
     * @param toEmail dirección de correo electrónico del destinatario.
     * @param token   token UUID de reactivación generado para este usuario.
     */
    @Override
    public void sendReactivationEmail(String toEmail, String token) {
        SimpleMailMessage message = buildReactivationMessage(toEmail, token);
        mailSender.send(message);
    }

    @Override
    public void sendBookingStatusEmail(String toEmail, String listingTitle, boolean isAccepted, java.time.LocalDateTime expiresAt) {
        SimpleMailMessage message = buildBookingStatusMessage(toEmail, listingTitle, isAccepted, expiresAt);
        mailSender.send(message);
    }

    @Override
    public void sendPaymentConfirmationToTenant(String toEmail, String listingTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("¡Pago confirmado! Reserva completada en " + listingTitle);
        message.setText("""
                Hola,

                ¡Buenas noticias! Hemos recibido correctamente el pago de la fianza para tu reserva en "%s".
                
                Tu reserva ha pasado al estado CONFIRMADA de forma definitiva. Puedes ponerte en contacto con el anfitrión para organizar tu llegada.

                ─────────────────────────────────────────────
                Este correo ha sido generado automáticamente. Por favor, no respondas a él.
                © Colivi — Plataforma de alojamiento universitario
                """.formatted(listingTitle));
        mailSender.send(message);
    }

    @Override
    public void sendPaymentNotificationToLandlord(String toEmail, String listingTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("¡Fianza pagada! Nueva reserva confirmada para " + listingTitle);
        message.setText("""
                Hola,

                Te informamos de que el inquilino ha realizado el pago de la fianza para tu alojamiento "%s".
                
                La reserva ha pasado al estado CONFIRMADA de forma definitiva. Todas las demás solicitudes pendientes que solapen con estas fechas se han cancelado automáticamente.

                ─────────────────────────────────────────────
                Este correo ha sido generado automáticamente. Por favor, no respondas a él.
                © Colivi — Plataforma de alojamiento universitario
                """.formatted(listingTitle));
        mailSender.send(message);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String token) {
        SimpleMailMessage message = buildPasswordResetMessage(toEmail, token);
        mailSender.send(message);
    }

    @Override
    public void sendNewBookingRequestToHost(java.util.UUID requestId, String toEmail, String tenantName, String tenantEmail, String listingTitle, java.time.LocalDate startDate, java.time.LocalDate endDate, String message) {
        SimpleMailMessage mailMessage = buildNewBookingRequestMessage(requestId, toEmail, tenantName, tenantEmail, listingTitle, startDate, endDate, message);
        mailSender.send(mailMessage);
    }

    // ─── Métodos privados de apoyo ────────────────────────────────────────────

    /**
     * Construye el objeto {@link SimpleMailMessage} con todos sus campos
     * correctamente rellenos.
     *
     * <p>Separar la construcción del mensaje de su envío favorece la
     * legibilidad y facilita el testing aislado de la composición del correo.</p>
     *
     * @param toEmail dirección de destino.
     * @param token   token de reactivación a incluir en el enlace.
     * @return mensaje listo para ser enviado.
     */
    private SimpleMailMessage buildReactivationMessage(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(reactivationSubject);
        message.setText(buildReactivationBody(token));

        return message;
    }

    /**
     * Genera el cuerpo del correo de reactivación con un mensaje claro
     * para el usuario y el enlace único de acción.
     *
     * @param token token de reactivación a incluir en la URL.
     * @return texto completo del cuerpo del correo.
     */
    private String buildReactivationBody(String token) {
        return """
                Hola,

                Hemos recibido una solicitud para reactivar tu cuenta en Colivi.

                Para completar el proceso, haz clic en el siguiente enlace o cópialo
                en tu navegador. Este enlace es válido durante las próximas 24 horas:

                %s%s

                Si no solicitaste esta reactivación, puedes ignorar este correo con total tranquilidad.
                Tu cuenta permanecerá inactiva y nadie más podrá acceder a ella.

                ─────────────────────────────────────────────
                Este correo ha sido generado automáticamente. Por favor, no respondas a él.
                © Colivi — Plataforma de alojamiento universitario
                """.formatted(reactivationUrlBase, token);
    }

    private SimpleMailMessage buildBookingStatusMessage(String toEmail, String listingTitle, boolean isAccepted, java.time.LocalDateTime expiresAt) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(isAccepted ? bookingAcceptedSubject : bookingRejectedSubject);
        message.setText(buildBookingStatusBody(listingTitle, isAccepted, expiresAt));

        return message;
    }

    private String buildBookingStatusBody(String listingTitle, boolean isAccepted, java.time.LocalDateTime expiresAt) {
        String statusText = isAccepted ? "ACEPTADA" : "RECHAZADA";
        String extraMessage = isAccepted 
            ? "El anfitrión ha aprobado tu solicitud. ¡Prepárate para tu próxima estancia!\n\nTienes hasta el " + expiresAt.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + " para pagar la fianza."
            : "Lamentablemente, el anfitrión no ha podido aprobar tu solicitud en esta ocasión.";

        return """
                Hola,

                Tenemos novedades sobre tu solicitud de reserva para "%s".
                Tu solicitud ha sido %s.

                %s

                ─────────────────────────────────────────────
                Este correo ha sido generado automáticamente. Por favor, no respondas a él.
                © Colivi — Plataforma de alojamiento universitario
                """.formatted(listingTitle, statusText, extraMessage);
    }

    private SimpleMailMessage buildPasswordResetMessage(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(passwordResetSubject);
        message.setText(buildPasswordResetBody(token));

        return message;
    }

    private String buildPasswordResetBody(String token) {
        return """
                Hola,

                Hemos recibido una solicitud para restablecer tu contraseña en Colivi.

                Para crear una nueva contraseña, haz clic en el siguiente enlace o cópialo
                en tu navegador. Este enlace es válido durante las próximas 24 horas:

                %s%s

                Si no solicitaste este cambio, puedes ignorar este correo con total tranquilidad.
                Tu contraseña no cambiará hasta que accedas al enlace de arriba y crees una nueva.

                ─────────────────────────────────────────────
                Este correo ha sido generado automáticamente. Por favor, no respondas a él.
                © Colivi — Plataforma de alojamiento universitario
                """.formatted(passwordResetUrlBase, token);
    }

    private SimpleMailMessage buildNewBookingRequestMessage(java.util.UUID requestId, String toEmail, String tenantName, String tenantEmail, String listingTitle, java.time.LocalDate startDate, java.time.LocalDate endDate, String userMessage) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        if (tenantEmail != null && !tenantEmail.isBlank()) {
            message.setReplyTo(tenantEmail);
        }
        message.setSubject("¡Nueva solicitud de reserva recibida para " + listingTitle + "!");

        String messagePart = (userMessage != null && !userMessage.isBlank())
                ? "\nMensaje del inquilino: \"" + userMessage + "\"\n"
                : "";

        String tenantEmailLine = (tenantEmail != null && !tenantEmail.isBlank())
                ? "• Correo de contacto: " + tenantEmail + "\n"
                : "";

        String requestUrl = (requestId != null && receivedRequestsUrlBase != null)
                ? receivedRequestsUrlBase + requestId
                : "";

        message.setText("""
                Hola,

                ¡Buenas noticias! Has recibido una nueva solicitud de reserva para tu alojamiento "%s".

                Detalles de la solicitud:
                • Inquilino: %s
                %s• Fechas: del %s al %s%s
                Puedes ver los detalles completos de la solicitud y responder a ella aquí:
                %s

                ─────────────────────────────────────────────
                Este correo ha sido generado automáticamente. Puedes responder directamente a este correo para contactar con el solicitante.
                © Colivi — Plataforma de alojamiento universitario
                """.formatted(
                listingTitle,
                tenantName,
                tenantEmailLine,
                startDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                endDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                messagePart,
                requestUrl
        ));

        return message;
    }
}
