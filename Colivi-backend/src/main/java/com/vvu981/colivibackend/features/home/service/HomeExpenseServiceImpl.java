package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.home.domain.*;
import com.vvu981.colivibackend.features.home.dto.*;
import com.vvu981.colivibackend.features.home.mapper.HomeExpenseMapper;
import com.vvu981.colivibackend.features.home.repository.HomeExpenseRepository;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeExpenseServiceImpl implements HomeExpenseCommandService, HomeExpenseQueryService {

    private final HomeExpenseRepository expenseRepository;
    private final HomeRepository homeRepository;
    private final HomeMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final HomeExpenseMapper expenseMapper;
    private final DebtSimplifierEngine debtSimplifierEngine;

    @Override
    @Transactional
    public ExpenseResponseDto createExpense(UUID homeId, CreateExpenseRequest request, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        Home home = homeRepository.findByIdAndDeletedAtIsNull(homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Hogar no encontrado"));

        validatePayerAndParticipants(homeId, request.payerId(), request.participantIds());

        User payer = userRepository.findByIdAndDeletedAtIsNull(request.payerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pagador no encontrado"));

        HomeExpense expense = new HomeExpense();
        expense.setHome(home);
        expense.setPayer(payer);
        expense.setDescription(request.description());
        expense.setTotalAmount(request.totalAmount());

        distributeExactAmount(expense, request.participantIds(), request.totalAmount());

        expenseRepository.save(expense);
        return expenseMapper.toExpenseResponseDto(expense);
    }

    @Override
    @Transactional
    public void deleteExpense(UUID homeId, UUID expenseId, UUID requestUserId) {
        HomeExpense expense = expenseRepository.findByIdAndDeletedAtIsNull(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto no encontrado"));

        if (!expense.getHome().getId().equals(homeId)) {
            throw new ResourceNotFoundException("El gasto no pertenece a este hogar");
        }

        User requestUser = userRepository.findByIdAndDeletedAtIsNull(requestUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        boolean isSystemAdmin = requestUser.getRole() == UserRole.ADMIN;
        boolean isPayer = expense.getPayer().getId().equals(requestUserId);
        
        boolean isHomeAdmin = false;
        Optional<HomeMember> memberOpt = memberRepository.findByHomeIdAndUserId(homeId, requestUserId);
        if (memberOpt.isPresent() && memberOpt.get().getStatus() == HomeMemberStatus.ACTIVE && memberOpt.get().getRole() == HomeRole.ADMIN) {
            isHomeAdmin = true;
        }

        if (!isSystemAdmin && !isPayer && !isHomeAdmin) {
            throw new UnauthorizedActionException("Solo el pagador original o un administrador pueden eliminar el gasto");
        }

        expense.softDelete();
        expenseRepository.save(expense);
    }

    @Override
    public List<ExpenseResponseDto> getHomeExpenses(UUID homeId, UUID requestUserId) {
        validateMemberHasReadAccess(homeId, requestUserId);

        List<HomeExpense> expenses = expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId);
        return expenses.stream()
                .map(expenseMapper::toExpenseResponseDto)
                .toList();
    }

    @Override
    public List<BalanceResponseDto> getHomeBalances(UUID homeId, UUID requestUserId) {
        validateMemberHasReadAccess(homeId, requestUserId);
        List<Balance> balances = calculateRawBalances(homeId);
        Map<UUID, User> userMap = fetchUsersForBalances(balances);

        return balances.stream()
                .map(b -> expenseMapper.toBalanceResponseDto(b, userMap))
                .toList();
    }

    @Override
    public List<DebtTransferResponseDto> getOptimizedTransfers(UUID homeId, UUID requestUserId) {
        validateMemberHasReadAccess(homeId, requestUserId);
        List<Balance> balances = calculateRawBalances(homeId);
        List<DebtTransfer> transfers = debtSimplifierEngine.simplify(balances);
        
        Map<UUID, User> userMap = fetchUsersForTransfers(transfers);
        
        return transfers.stream()
                .map(t -> expenseMapper.toDebtTransferResponseDto(t, userMap))
                .toList();
    }

    @Override
    public BigDecimal getUserBalance(UUID homeId, UUID userId) {
        List<Balance> balances = calculateRawBalances(homeId);
        return balances.stream()
                .filter(b -> b.userId().equals(userId))
                .map(Balance::amount)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    // =========================================================================
    // LÓGICA DE REPARTO
    // =========================================================================
    private void distributeExactAmount(HomeExpense expense, List<UUID> participantIds, BigDecimal total) {
        int n = participantIds.size();
        BigDecimal bdN = new BigDecimal(n);
        
        BigDecimal baseAmount = total.divide(bdN, 2, RoundingMode.DOWN);
        BigDecimal remainder = total.subtract(baseAmount.multiply(bdN));
        int extraCents = remainder.multiply(new BigDecimal("100")).intValue();
        
        BigDecimal sumCheck = BigDecimal.ZERO;

        for (int i = 0; i < n; i++) {
            UUID participantId = participantIds.get(i);
            User participantUser = userRepository.findByIdAndDeletedAtIsNull(participantId).orElseThrow();
            
            BigDecimal owed = baseAmount;
            if (i < extraCents) {
                owed = owed.add(new BigDecimal("0.01"));
            }
            
            sumCheck = sumCheck.add(owed);
            
            HomeExpenseParticipant hep = new HomeExpenseParticipant();
            hep.setUser(participantUser);
            hep.setOwedAmount(owed);
            expense.addParticipant(hep);
        }

        if (sumCheck.compareTo(total) != 0) {
            throw new IllegalStateException("Error crítico financiero: Fuga de céntimos en el reparto. Suma: " + sumCheck + ", Total: " + total);
        }
    }

    // =========================================================================
    // CÁLCULO DE BALANCES
    // =========================================================================
    private List<Balance> calculateRawBalances(UUID homeId) {
        List<HomeExpense> expenses = expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId);
        
        Map<UUID, BigDecimal> netBalances = new HashMap<>();

        for (HomeExpense exp : expenses) {
            // El pagador "recibe" crédito (+ totalAmount)
            netBalances.merge(exp.getPayer().getId(), exp.getTotalAmount(), BigDecimal::add);
            
            // Los participantes "deben" dinero (- owedAmount)
            for (HomeExpenseParticipant p : exp.getParticipants()) {
                netBalances.merge(p.getUser().getId(), p.getOwedAmount().negate(), BigDecimal::add);
            }
        }

        return netBalances.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) != 0) // ignorar a los que están a 0
                .map(e -> new Balance(e.getKey(), e.getValue()))
                .toList();
    }

    // =========================================================================
    // VALIDACIONES Y HELPERS
    // =========================================================================
    private void validateActiveMember(UUID homeId, UUID userId) {
        HomeMember member = memberRepository.findByHomeIdAndUserId(homeId, userId)
                .orElseThrow(() -> new UnauthorizedActionException("No perteneces a este hogar"));
        if (member.getStatus() != HomeMemberStatus.ACTIVE) {
            throw new UnauthorizedActionException("Debes ser un miembro activo para realizar esta acción");
        }
    }
    
    private void validateMemberHasReadAccess(UUID homeId, UUID userId) {
        HomeMember member = memberRepository.findByHomeIdAndUserId(homeId, userId)
                .orElseThrow(() -> new UnauthorizedActionException("No perteneces a este hogar"));
        if (member.getStatus() != HomeMemberStatus.ACTIVE && member.getStatus() != HomeMemberStatus.LEFT) {
            throw new UnauthorizedActionException("No tienes acceso a los gastos de este hogar");
        }
    }

    private void validatePayerAndParticipants(UUID homeId, UUID payerId, List<UUID> participantIds) {
        Set<UUID> usersToCheck = new HashSet<>(participantIds);
        usersToCheck.add(payerId);

        List<HomeMember> activeMembers = memberRepository.findByHomeIdAndStatus(homeId, HomeMemberStatus.ACTIVE);
        Set<UUID> activeUserIds = activeMembers.stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toSet());

        for (UUID userId : usersToCheck) {
            if (!activeUserIds.contains(userId)) {
                throw new BusinessRuleValidationException("El pagador y todos los participantes deben ser miembros ACTIVOS del hogar");
            }
        }
    }
    
    private Map<UUID, User> fetchUsersForBalances(List<Balance> balances) {
        List<UUID> userIds = balances.stream().map(Balance::userId).toList();
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
    }
    
    private Map<UUID, User> fetchUsersForTransfers(List<DebtTransfer> transfers) {
        Set<UUID> userIds = new HashSet<>();
        for (DebtTransfer t : transfers) {
            userIds.add(t.fromUserId());
            userIds.add(t.toUserId());
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
    }
}
