package com.vvu981.colivibackend.features.auth.service;

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
}
