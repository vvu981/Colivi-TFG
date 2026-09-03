package com.vvu981.colivibackend.features.home.controller;

import com.vvu981.colivibackend.features.home.dto.BalanceResponseDto;
import com.vvu981.colivibackend.features.home.dto.CreateExpenseRequest;
import com.vvu981.colivibackend.features.home.dto.DebtTransferResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseFilterDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;
import com.vvu981.colivibackend.features.home.dto.RecordPaymentRequest;
import com.vvu981.colivibackend.features.home.dto.UpdateExpenseRequest;
import com.vvu981.colivibackend.features.home.service.HomeExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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

    @PutMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponseDto> updateExpense(
            @PathVariable UUID homeId,
            @PathVariable UUID expenseId,
            @Valid @RequestBody UpdateExpenseRequest request,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        ExpenseResponseDto expense = commandService.updateExpense(homeId, expenseId, request, requestUserId);
        return ResponseEntity.ok(expense);
    }

    @PostMapping("/payments")
    public ResponseEntity<ExpenseResponseDto> recordPayment(
            @PathVariable UUID homeId,
            @Valid @RequestBody RecordPaymentRequest request,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        ExpenseResponseDto payment = commandService.recordPayment(homeId, request, requestUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
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
    public ResponseEntity<Page<ExpenseResponseDto>> getHomeExpenses(
            @PathVariable UUID homeId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID payerId,
            @RequestParam(required = false) Boolean onlyPayments,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal(expression = "id") UUID requestUserId) {
        ExpenseFilterDto filter = ExpenseFilterDto.of(search, payerId, onlyPayments);
        Page<ExpenseResponseDto> expenses = queryService.getHomeExpensesPaged(homeId, filter, pageable, requestUserId);
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
