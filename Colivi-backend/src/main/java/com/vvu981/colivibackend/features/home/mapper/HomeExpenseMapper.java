package com.vvu981.colivibackend.features.home.mapper;

import com.vvu981.colivibackend.features.home.domain.Balance;
import com.vvu981.colivibackend.features.home.domain.DebtTransfer;
import com.vvu981.colivibackend.features.home.domain.HomeExpense;
import com.vvu981.colivibackend.features.home.domain.HomeExpenseParticipant;
import com.vvu981.colivibackend.features.home.dto.BalanceResponseDto;
import com.vvu981.colivibackend.features.home.dto.DebtTransferResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseParticipantResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class HomeExpenseMapper {

    private final UserMapper userMapper;

    public ExpenseResponseDto toExpenseResponseDto(HomeExpense expense) {
        return new ExpenseResponseDto(
                expense.getId(),
                expense.getHome().getId(),
                expense.getDescription(),
                expense.getTotalAmount(),
                userMapper.toUserProfileDto(expense.getPayer()),
                expense.getCreatedAt(),
                expense.getParticipants().stream()
                        .map(this::toParticipantResponseDto)
                        .toList()
        );
    }

    public ExpenseParticipantResponseDto toParticipantResponseDto(HomeExpenseParticipant participant) {
        return new ExpenseParticipantResponseDto(
                participant.getId(),
                userMapper.toUserProfileDto(participant.getUser()),
                participant.getOwedAmount()
        );
    }

    public BalanceResponseDto toBalanceResponseDto(Balance balance, Map<UUID, User> userMap) {
        User user = userMap.get(balance.userId());
        return new BalanceResponseDto(
                userMapper.toUserProfileDto(user),
                balance.amount()
        );
    }

    public DebtTransferResponseDto toDebtTransferResponseDto(DebtTransfer transfer, Map<UUID, User> userMap) {
        User fromUser = userMap.get(transfer.fromUserId());
        User toUser = userMap.get(transfer.toUserId());
        return new DebtTransferResponseDto(
                userMapper.toUserProfileDto(fromUser),
                userMapper.toUserProfileDto(toUser),
                transfer.amount()
        );
    }
}
