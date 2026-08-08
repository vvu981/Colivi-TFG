package com.vvu981.colivibackend.features.home.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Representa una instrucción directa de pago sugerida por el motor para saldar cuentas.
 */
public record DebtTransfer(UUID fromUserId, UUID toUserId, BigDecimal amount) {}
