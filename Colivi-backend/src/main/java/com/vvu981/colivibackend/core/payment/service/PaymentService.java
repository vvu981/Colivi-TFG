package com.vvu981.colivibackend.core.payment.service;

import java.math.BigDecimal;

public interface PaymentService {
    
    /**
     * Procesa un pago utilizando un token de pasarela (e.g. Stripe).
     *
     * @param paymentToken El token seguro provisto por el frontend.
     * @param amount       La cantidad a cobrar (opcional en un mock simple, pero ideal).
     * @return El ID de la transacción generada si fue exitosa.
     */
    String processPayment(String paymentToken, BigDecimal amount);

    /**
     * Reembolsa un pago utilizando el ID de transacción generado.
     *
     * @param transactionId El ID de la transacción a reembolsar.
     */
    void refund(String transactionId);
}
