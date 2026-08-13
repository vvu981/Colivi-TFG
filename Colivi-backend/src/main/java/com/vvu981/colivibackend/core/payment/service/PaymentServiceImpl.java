package com.vvu981.colivibackend.core.payment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    @Override
    public String processPayment(String paymentToken, BigDecimal amount) {
        log.info("Procesando pago simulado mediante token: {} por la cantidad de: {}", paymentToken, amount);
        
        // Simulación de un procesamiento exitoso en una pasarela de pago
        if (paymentToken == null || paymentToken.isBlank()) {
            throw new IllegalArgumentException("El token de pago no puede ser nulo o vacío");
        }
        
        String transactionId = "TXN-" + UUID.randomUUID().toString();
        log.info("Pago procesado exitosamente. Transacción ID: {}", transactionId);
        
        return transactionId;
    }
}
