package com.vvu981.colivibackend.features.home.domain;

/**
 * Representa el saldo neto consolidado de un usuario en el hogar.
 * Un valor positivo (> 0) indica que el grupo le debe dinero a esta persona.
 * Un valor negativo (< 0) indica que esta persona le debe dinero al grupo.
 * Un valor de 0 indica que está al corriente de pago.
 */
public record Balance(String userId, double amount) {}