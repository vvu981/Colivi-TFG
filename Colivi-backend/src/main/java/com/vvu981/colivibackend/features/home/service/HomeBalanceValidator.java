package com.vvu981.colivibackend.features.home.service;

import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Validador temporal para el balance de un usuario en un hogar.
 * TODO: Reemplazar o integrar con el módulo de 'Gastos/Expenses' cuando esté
 * implementado.
 */
@Service
public class HomeBalanceValidator {

    /**
     * Valida que el balance neto de un miembro sea exactamente 0.
     * Lanza excepción si el usuario tiene deudas pendientes o se le debe dinero.
     */
    public void validateZeroBalance(UUID homeId, UUID userId) {
        // TODO: Consultar módulo de gastos.
        // Por ahora, asumimos que siempre es 0 para permitir salir/expulsar.

        // if (balanceNeto != 0) {
        // throw new BusinessRuleValidationException(
        // "El usuario no puede salir o ser expulsado porque tiene un balance neto
        // pendiente (" + balanceNeto + ").");
        // }
    }
}
