package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;

import java.util.UUID;

public interface HomeExpenseCommandService {

    ExpenseResponseDto createExpense(UUID homeId, CreateExpenseRequest request, UUID requestUserId);

    void deleteExpense(UUID homeId, UUID expenseId, UUID requestUserId);
}
