package com.vvu981.colivibackend.features.home.dto;

import java.util.UUID;

public record ExpenseFilterDto(
        String search,
        UUID payerId,
        Boolean onlyPayments
) {
        public static ExpenseFilterDto of(String search, UUID payerId, Boolean onlyPayments) {
                return new ExpenseFilterDto(search, payerId, onlyPayments);
        }
}
