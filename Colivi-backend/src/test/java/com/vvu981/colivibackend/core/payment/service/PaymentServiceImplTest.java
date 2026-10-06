package com.vvu981.colivibackend.core.payment.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class PaymentServiceImplTest {

    private final PaymentServiceImpl paymentService = new PaymentServiceImpl();

    @Test
    void processPaymentSuccess() {
        String token = "tok_valid_123";
        BigDecimal amount = new BigDecimal("100.00");
        
        String transactionId = paymentService.processPayment(token, amount);
        
        assertNotNull(transactionId);
        assertTrue(transactionId.startsWith("TXN-"));
    }

    @Test
    void processPaymentFailsWithNullToken() {
        BigDecimal amount = new BigDecimal("100.00");
        
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> 
            paymentService.processPayment(null, amount)
        );
        assertEquals("El token de pago no puede ser nulo o vacío", exception.getMessage());
    }

    @Test
    void processPaymentFailsWithBlankToken() {
        String token = "   ";
        BigDecimal amount = new BigDecimal("100.00");
        
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> 
            paymentService.processPayment(token, amount)
        );
        assertEquals("El token de pago no puede ser nulo o vacío", exception.getMessage());
    }

    @Test
    void refundSuccess() {
        String transactionId = "TXN-12345";
        
        assertDoesNotThrow(() -> paymentService.refund(transactionId));
    }
}
