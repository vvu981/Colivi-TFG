package com.vvu981.colivibackend.features.hogar.domain;

/**
 * Representa una instrucción directa de pago sugerida por el motor para saldar cuentas.
 */
public record DebtTransfer(String fromUserId, String toUserId, double amount) {}