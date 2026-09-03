package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HomeBalanceValidatorTest {

    @Mock
    private HomeExpenseService expenseQueryService;

    @InjectMocks
    private HomeBalanceValidator validator;

    private UUID homeId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        homeId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void validateZeroBalance_Success_WhenBalanceIsZero() {
        when(expenseQueryService.getUserBalance(homeId, userId)).thenReturn(BigDecimal.ZERO);
        assertDoesNotThrow(() -> validator.validateZeroBalance(homeId, userId));
    }

    @Test
    void validateZeroBalance_ThrowsException_WhenBalanceIsNotZero() {
        when(expenseQueryService.getUserBalance(homeId, userId)).thenReturn(new BigDecimal("10.00"));
        assertThrows(BusinessRuleValidationException.class, () -> validator.validateZeroBalance(homeId, userId));
    }

    @Test
    void validateNoPendingDebt_Success_WhenBalanceIsZero() {
        when(expenseQueryService.getUserBalance(homeId, userId)).thenReturn(BigDecimal.ZERO);
        assertDoesNotThrow(() -> validator.validateNoPendingDebt(homeId, userId));
    }

    @Test
    void validateNoPendingDebt_Success_WhenBalanceIsPositive() {
        when(expenseQueryService.getUserBalance(homeId, userId)).thenReturn(new BigDecimal("25.50"));
        assertDoesNotThrow(() -> validator.validateNoPendingDebt(homeId, userId));
    }

    @Test
    void validateNoPendingDebt_ThrowsException_WhenBalanceIsNegative() {
        when(expenseQueryService.getUserBalance(homeId, userId)).thenReturn(new BigDecimal("-10.00"));
        assertThrows(BusinessRuleValidationException.class, () -> validator.validateNoPendingDebt(homeId, userId));
    }
}
