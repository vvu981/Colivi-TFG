package com.vvu981.colivibackend.features.home.controller;

import com.vvu981.colivibackend.features.home.dto.BalanceResponseDto;
import com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest;
import com.vvu981.colivibackend.features.home.dto.DebtTransferResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;
import com.vvu981.colivibackend.features.home.service.HomeExpenseCommandService;
import com.vvu981.colivibackend.features.home.service.HomeExpenseQueryService;
import com.vvu981.colivibackend.features.user.domain.User;
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

    private final HomeExpenseCommandService commandService;
    private final HomeExpenseQueryService queryService;

    @PostMapping
    public ResponseEntity<ExpenseResponseDto> createExpense(
            @PathVariable UUID homeId,
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal User requestUser) {
        ExpenseResponseDto expense = commandService.createExpense(homeId, request, requestUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable UUID homeId,
            @PathVariable UUID expenseId,
            @AuthenticationPrincipal User requestUser) {
        commandService.deleteExpense(homeId, expenseId, requestUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponseDto>> getHomeExpenses(
            @PathVariable UUID homeId,
            @AuthenticationPrincipal User requestUser) {
        List<ExpenseResponseDto> expenses = queryService.getHomeExpenses(homeId, requestUser.getId());
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/balances")
    public ResponseEntity<List<BalanceResponseDto>> getHomeBalances(
            @PathVariable UUID homeId,
            @AuthenticationPrincipal User requestUser) {
        List<BalanceResponseDto> balances = queryService.getHomeBalances(homeId, requestUser.getId());
        return ResponseEntity.ok(balances);
    }

    @GetMapping("/balances/transfers")
    public ResponseEntity<List<DebtTransferResponseDto>> getOptimizedTransfers(
            @PathVariable UUID homeId,
            @AuthenticationPrincipal User requestUser) {
        List<DebtTransferResponseDto> transfers = queryService.getOptimizedTransfers(homeId, requestUser.getId());
        return ResponseEntity.ok(transfers);
    }
}
