package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Validador de balance de un usuario en un hogar.
 */
@Service
public class HomeBalanceValidator {

    private final HomeExpenseQueryService expenseQueryService;

    // Usamos @Lazy para evitar posibles dependencias circulares si HomeService 
    // y HomeExpenseQueryService terminan dependiendo entre sí.
    public HomeBalanceValidator(@Lazy HomeExpenseQueryService expenseQueryService) {
        this.expenseQueryService = expenseQueryService;
    }

    /**
     * Valida que el balance neto de un miembro sea exactamente 0.
     * Lanza excepción si el usuario tiene deudas pendientes o se le debe dinero.
     */
    public void validateZeroBalance(UUID homeId, UUID userId) {
        BigDecimal balanceNeto = expenseQueryService.getUserBalance(homeId, userId);

        if (balanceNeto.compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessRuleValidationException(
                    "El usuario no puede salir o ser expulsado porque tiene un balance neto pendiente (" + balanceNeto + "€)."
            );
        }
    }
}
