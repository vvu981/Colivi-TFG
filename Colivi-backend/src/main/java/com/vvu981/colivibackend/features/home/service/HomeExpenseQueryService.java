package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.dto.BalanceResponseDto;
import com.vvu981.colivibackend.features.home.dto.DebtTransferResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;

import java.util.List;
import java.util.UUID;

public interface HomeExpenseQueryService {

    List<ExpenseResponseDto> getHomeExpenses(UUID homeId, UUID requestUserId);

    List<BalanceResponseDto> getHomeBalances(UUID homeId, UUID requestUserId);

    List<DebtTransferResponseDto> getOptimizedTransfers(UUID homeId, UUID requestUserId);

    java.math.BigDecimal getUserBalance(UUID homeId, UUID userId);
}
