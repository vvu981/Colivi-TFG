package com.vvu981.colivibackend.features.auth.service;

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
}
