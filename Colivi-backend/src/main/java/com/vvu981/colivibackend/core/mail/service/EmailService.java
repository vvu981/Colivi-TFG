package com.vvu981.colivibackend.core.mail.service;

/**
 * Contrato que define las operaciones de envío de correo electrónico
 * para el módulo de autenticación de Colivi.
 *
 * <p>Siguiendo el principio de Inversión de Dependencias (DIP) de SOLID,
 * el resto de componentes del sistema dependen de esta abstracción y no
 * de la implementación concreta ({@link EmailServiceImpl}).</p>
 */
public interface EmailService {

    /**
     * Envía un correo electrónico de reactivación de cuenta al usuario.
     *
     * <p>El correo contiene un enlace único con el token de reactivación
     * que apunta al frontend de Next.js para que el usuario complete el proceso.</p>
     *
     * @param toEmail dirección de correo electrónico del destinatario. No debe ser nulo ni vacío.
     * @param token   token UUID de reactivación generado para este usuario. No debe ser nulo ni vacío.
     */
    void sendReactivationEmail(String toEmail, String token);

    /**
     * Envía un correo electrónico de notificación sobre el cambio de estado de una reserva.
     *
     * @param toEmail      el correo electrónico del inquilino que hizo la reserva.
     * @param listingTitle el título del alojamiento para darle contexto al usuario.
     * @param isAccepted   true si la reserva fue aceptada, false si fue rechazada.
     * @param expiresAt    la fecha límite de pago si la reserva fue aceptada.
     */
    void sendBookingStatusEmail(String toEmail, String listingTitle, boolean isAccepted, java.time.LocalDateTime expiresAt);

    /**
     * Envía un correo electrónico al inquilino confirmando el pago.
     *
     * @param toEmail      el correo electrónico del inquilino.
     * @param listingTitle el título del alojamiento reservado.
     */
    void sendPaymentConfirmationToTenant(String toEmail, String listingTitle);

    /**
     * Envía un correo electrónico al propietario notificando el pago.
     *
     * @param toEmail      el correo electrónico del propietario.
     * @param listingTitle el título del alojamiento reservado.
     */
    void sendPaymentNotificationToLandlord(String toEmail, String listingTitle);

    /**
     * Envía un correo electrónico de recuperación de contraseña al usuario.
     *
     * @param toEmail dirección de correo electrónico del destinatario.
     * @param token   token UUID de recuperación de contraseña generado.
     */
    void sendPasswordResetEmail(String toEmail, String token);

    /**
     * Envía un correo electrónico al propietario notificándole que ha recibido una nueva solicitud de reserva.
     *
     * @param toEmail      correo electrónico del propietario/anfitrión.
     * @param tenantName   nombre completo del inquilino que solicita la reserva.
     * @param listingTitle título del alojamiento solicitado.
     * @param startDate    fecha de inicio de la estancia.
     * @param endDate      fecha de fin de la estancia.
     * @param message      mensaje personalizado del inquilino (puede ser nulo o vacío).
     */
    void sendNewBookingRequestToHost(String toEmail, String tenantName, String listingTitle, java.time.LocalDate startDate, java.time.LocalDate endDate, String message);
}
