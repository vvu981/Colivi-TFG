package com.vvu981.colivibackend.features.home.controller;

import com.vvu981.colivibackend.features.home.dto.BalanceResponseDto;
import com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest;
import com.vvu981.colivibackend.features.home.dto.DebtTransferResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;
import com.vvu981.colivibackend.features.home.service.HomeExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/homes/{homeId}/expenses")
@RequiredArgsConstructor
public class HomeExpenseController {

    private final HomeExpenseService commandService;
    private final HomeExpenseService queryService;

    @PostMapping
    public ResponseEntity<ExpenseResponseDto> createExpense(
            @PathVariable UUID homeId,
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        ExpenseResponseDto expense = commandService.createExpense(homeId, request, requestUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable UUID homeId,
            @PathVariable UUID expenseId,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        commandService.deleteExpense(homeId, expenseId, requestUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponseDto>> getHomeExpenses(
            @PathVariable UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        List<ExpenseResponseDto> expenses = queryService.getHomeExpenses(homeId, requestUserId);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/balances")
    public ResponseEntity<List<BalanceResponseDto>> getHomeBalances(
            @PathVariable UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        List<BalanceResponseDto> balances = queryService.getHomeBalances(homeId, requestUserId);
        return ResponseEntity.ok(balances);
    }

    @GetMapping("/balances/transfers")
    public ResponseEntity<List<DebtTransferResponseDto>> getOptimizedTransfers(
            @PathVariable UUID homeId,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        List<DebtTransferResponseDto> transfers = queryService.getOptimizedTransfers(homeId, requestUserId);
        return ResponseEntity.ok(transfers);
    }
}
