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
     * @param toEmail      dirección de correo electrónico del inquilino destinatario.
     * @param listingTitle el título del alojamiento para darle contexto al usuario.
     * @param isAccepted   true si la reserva fue aceptada, false si fue rechazada.
     */
    void sendBookingStatusEmail(String toEmail, String listingTitle, boolean isAccepted);
}
