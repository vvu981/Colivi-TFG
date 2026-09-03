package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.dto.BalanceResponseDto;
import com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest;
import com.vvu981.colivibackend.features.home.dto.DebtTransferResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;
import com.vvu981.colivibackend.features.home.dto.RecordPaymentRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface HomeExpenseService {

    ExpenseResponseDto createExpense(UUID homeId, CreateExpenseRequest request, UUID requestUserId);

    ExpenseResponseDto recordPayment(UUID homeId, RecordPaymentRequest request, UUID requestUserId);

    void deleteExpense(UUID homeId, UUID expenseId, UUID requestUserId);

    List<ExpenseResponseDto> getHomeExpenses(UUID homeId, UUID requestUserId);

    List<BalanceResponseDto> getHomeBalances(UUID homeId, UUID requestUserId);

    List<DebtTransferResponseDto> getOptimizedTransfers(UUID homeId, UUID requestUserId);

    BigDecimal getUserBalance(UUID homeId, UUID userId);
}
