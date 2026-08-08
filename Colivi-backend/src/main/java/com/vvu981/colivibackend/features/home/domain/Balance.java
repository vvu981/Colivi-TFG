package com.vvu981.colivibackend.features.home.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Representa el saldo neto consolidado de un usuario en el hogar.
 * Un valor positivo (> 0) indica que el grupo le debe dinero a esta persona.
 * Un valor negativo (< 0) indica que esta persona le debe dinero al grupo.
 * Un valor de 0 indica que está al corriente de pago.
 */
public record Balance(UUID userId, BigDecimal amount) {}
