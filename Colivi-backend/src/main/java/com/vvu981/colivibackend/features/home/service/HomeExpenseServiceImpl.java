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
import com.vvu981.colivibackend.features.home.domain.event.ExpenseCreatedEvent;
import com.vvu981.colivibackend.features.home.domain.event.ExpenseDeletedEvent;
import com.vvu981.colivibackend.features.home.domain.event.ExpenseUpdatedEvent;
import com.vvu981.colivibackend.features.home.domain.event.PaymentRecordedEvent;
import com.vvu981.colivibackend.features.home.repository.specification.HomeExpenseSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeExpenseServiceImpl implements HomeExpenseService {

    private final HomeExpenseRepository expenseRepository;
    private final HomeRepository homeRepository;
    private final HomeMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final HomeExpenseMapper expenseMapper;
    private final DebtSimplifierService debtSimplifierService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public ExpenseResponseDto createExpense(UUID homeId, CreateExpenseRequest request, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        Home home = homeRepository.findByIdAndDeletedAtIsNull(homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Hogar no encontrado"));

        validatePayerAndParticipants(homeId, request.payerId(), request.participantIds());

        User payer = userRepository.findActiveById(request.payerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pagador no encontrado"));

        HomeExpense expense = new HomeExpense();
        expense.setHome(home);
        expense.setPayer(payer);
        expense.setDescription(request.description());
        expense.setTotalAmount(request.totalAmount());

        if (request.customSplits() != null && !request.customSplits().isEmpty()) {
            distributeCustomSplits(expense, request.customSplits(), request.participantIds(), request.totalAmount());
        } else {
            distributeExactAmount(expense, request.participantIds(), request.totalAmount());
        }

        expenseRepository.save(expense);
        
        eventPublisher.publishEvent(new ExpenseCreatedEvent(
                homeId, 
                requestUserId, 
                expense.getDescription(), 
                expense.getTotalAmount()
        ));
        
        return expenseMapper.toExpenseResponseDto(expense);
    }

    @Override
    @Transactional
    public ExpenseResponseDto updateExpense(UUID homeId, UUID expenseId, UpdateExpenseRequest request, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        HomeExpense expense = expenseRepository.findByIdAndDeletedAtIsNull(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto no encontrado"));

        if (!expense.getHome().getId().equals(homeId)) {
            throw new ResourceNotFoundException("El gasto no pertenece a este hogar");
        }

        if (expense.isPayment()) {
            throw new BusinessRuleValidationException("Los pagos directos no pueden ser editados. Si hubo un error, elimínalo y regístralo de nuevo.");
        }

        User requestUser = userRepository.findActiveById(requestUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        boolean isSystemAdmin = requestUser.getRole() == UserRole.ADMIN;
        boolean isPayer = expense.getPayer().getId().equals(requestUserId);
        boolean isHomeAdmin = memberRepository.findByHomeIdAndUserId(homeId, requestUserId)
                .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE && m.getRole() == HomeRole.ADMIN)
                .isPresent();

        if (!isSystemAdmin && !isPayer && !isHomeAdmin) {
            throw new UnauthorizedActionException("Solo el pagador original o un administrador pueden editar el gasto");
        }

        validatePayerAndParticipants(homeId, request.payerId(), request.participantIds());

        User newPayer = userRepository.findActiveById(request.payerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pagador no encontrado"));

        expense.setDescription(request.description());
        expense.setTotalAmount(request.totalAmount());
        expense.setPayer(newPayer);

        expense.getParticipants().clear();

        if (request.customSplits() != null && !request.customSplits().isEmpty()) {
            distributeCustomSplits(expense, request.customSplits(), request.participantIds(), request.totalAmount());
        } else {
            distributeExactAmount(expense, request.participantIds(), request.totalAmount());
        }

        expenseRepository.save(expense);

        eventPublisher.publishEvent(new ExpenseUpdatedEvent(
                homeId,
                requestUserId,
                expense.getDescription(),
                expense.getTotalAmount()
        ));

        return expenseMapper.toExpenseResponseDto(expense);
    }

    @Override
    @Transactional
    public ExpenseResponseDto recordPayment(UUID homeId, RecordPaymentRequest request, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        if (request.payerId().equals(request.receiverId())) {
            throw new BusinessRuleValidationException("El pagador y el receptor no pueden ser la misma persona");
        }

        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleValidationException("El importe del pago debe ser mayor que 0");
        }

        Home home = homeRepository.findByIdAndDeletedAtIsNull(homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Hogar no encontrado"));

        validatePayerAndParticipants(homeId, request.payerId(), List.of(request.receiverId()));

        User requestUser = userRepository.findActiveById(requestUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        boolean isPayer = request.payerId().equals(requestUserId);
        boolean isReceiver = request.receiverId().equals(requestUserId);
        boolean isSystemAdmin = requestUser.getRole() == UserRole.ADMIN;
        boolean isHomeAdmin = memberRepository.findByHomeIdAndUserId(homeId, requestUserId)
                .filter(m -> m.getStatus() == HomeMemberStatus.ACTIVE && m.getRole() == HomeRole.ADMIN)
                .isPresent();

        if (!isPayer && !isReceiver && !isSystemAdmin && !isHomeAdmin) {
            throw new UnauthorizedActionException("Solo las partes involucradas en el pago o un administrador pueden registrar este pago");
        }

        User payer = userRepository.findActiveById(request.payerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pagador no encontrado"));
        User receiver = userRepository.findActiveById(request.receiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receptor no encontrado"));

        HomeExpense payment = new HomeExpense();
        payment.setHome(home);
        payment.setPayer(payer);
        String desc = (request.notes() != null && !request.notes().isBlank())
                ? request.notes().trim()
                : "Pago a " + (receiver.getFirstName() != null ? receiver.getFirstName() : receiver.getNickname());
        payment.setDescription(desc);
        payment.setTotalAmount(request.amount());
        payment.setPayment(true);

        HomeExpenseParticipant participant = new HomeExpenseParticipant();
        participant.setUser(receiver);
        participant.setOwedAmount(request.amount());
        payment.addParticipant(participant);

        expenseRepository.save(payment);

        eventPublisher.publishEvent(new PaymentRecordedEvent(
                homeId,
                requestUserId,
                request.payerId(),
                request.receiverId(),
                receiver.getFirstName() != null ? receiver.getFirstName() : receiver.getNickname(),
                request.amount(),
                request.notes()
        ));

        return expenseMapper.toExpenseResponseDto(payment);
    }

    @Override
    @Transactional
    public void deleteExpense(UUID homeId, UUID expenseId, UUID requestUserId) {
        HomeExpense expense = expenseRepository.findByIdAndDeletedAtIsNull(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto no encontrado"));

        if (!expense.getHome().getId().equals(homeId)) {
            throw new ResourceNotFoundException("El gasto no pertenece a este hogar");
        }

        User requestUser = userRepository.findActiveById(requestUserId)
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
        
        eventPublisher.publishEvent(new ExpenseDeletedEvent(
                homeId,
                requestUserId,
                expense.getDescription()
        ));
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
    public Page<ExpenseResponseDto> getHomeExpensesPaged(UUID homeId, ExpenseFilterDto filter, Pageable pageable, UUID requestUserId) {
        validateMemberHasReadAccess(homeId, requestUserId);

        Page<HomeExpense> expensePage = expenseRepository.findAll(
                HomeExpenseSpecification.withFilter(homeId, filter),
                pageable
        );

        return expensePage.map(expenseMapper::toExpenseResponseDto);
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
        List<DebtTransfer> transfers = debtSimplifierService.simplify(balances);
        
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
        List<UUID> uniqueParticipantIds = participantIds.stream().distinct().toList();
        int n = uniqueParticipantIds.size();
        BigDecimal bdN = new BigDecimal(n);
        
        BigDecimal baseAmount = total.divide(bdN, 2, RoundingMode.DOWN);
        BigDecimal remainder = total.subtract(baseAmount.multiply(bdN));
        int extraCents = remainder.multiply(new BigDecimal("100")).intValue();
        
        BigDecimal sumCheck = BigDecimal.ZERO;
        
        Map<UUID, User> participantsMap = userRepository.findAllById(uniqueParticipantIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        for (int i = 0; i < n; i++) {
            UUID participantId = uniqueParticipantIds.get(i);
            User participantUser = participantsMap.get(participantId);
            if (participantUser == null || participantUser.getDeletedAt() != null) {
                throw new ResourceNotFoundException("Participante no encontrado con ID: " + participantId);
            }
            
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

    private void distributeCustomSplits(HomeExpense expense, List<ExpenseParticipantShareDto> splits, List<UUID> participantIds, BigDecimal total) {
        Set<UUID> declaredParticipantIds = new HashSet<>(participantIds);
        Set<UUID> splitUserIds = new HashSet<>();
        BigDecimal sum = BigDecimal.ZERO;

        for (ExpenseParticipantShareDto share : splits) {
            if (share == null || share.userId() == null || share.amount() == null) {
                throw new BusinessRuleValidationException("Cada desglose de participante debe ser válido y tener importe");
            }
            if (!splitUserIds.add(share.userId())) {
                throw new BusinessRuleValidationException("No puede haber usuarios duplicados en el reparto personalizado");
            }
            if (!declaredParticipantIds.contains(share.userId())) {
                throw new BusinessRuleValidationException("El usuario del reparto personalizado no está en la lista de participantes declarada");
            }
            sum = sum.add(share.amount());
        }

        if (splitUserIds.size() != declaredParticipantIds.size()) {
            throw new BusinessRuleValidationException("Todos los participantes del gasto deben tener asignada su parte en el reparto");
        }

        if (sum.compareTo(total) != 0) {
            throw new BusinessRuleValidationException(
                    "La suma de los importes individuales (" + sum + ") debe coincidir exactamente con el total del gasto (" + total + ")");
        }

        Map<UUID, User> participantsMap = userRepository.findAllById(splitUserIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        for (ExpenseParticipantShareDto share : splits) {
            User user = participantsMap.get(share.userId());
            if (user == null || user.getDeletedAt() != null) {
                throw new ResourceNotFoundException("Participante no encontrado con ID: " + share.userId());
            }

            HomeExpenseParticipant hep = new HomeExpenseParticipant();
            hep.setUser(user);
            hep.setOwedAmount(share.amount());
            expense.addParticipant(hep);
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
