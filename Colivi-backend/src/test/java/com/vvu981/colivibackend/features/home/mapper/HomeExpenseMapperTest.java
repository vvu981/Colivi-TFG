package com.vvu981.colivibackend.features.home.mapper;

import com.vvu981.colivibackend.features.home.domain.Balance;
import com.vvu981.colivibackend.features.home.domain.DebtTransfer;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeExpense;
import com.vvu981.colivibackend.features.home.domain.HomeExpenseParticipant;
import com.vvu981.colivibackend.features.home.dto.BalanceResponseDto;
import com.vvu981.colivibackend.features.home.dto.DebtTransferResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseParticipantResponseDto;
import com.vvu981.colivibackend.features.home.dto.ExpenseResponseDto;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.dto.UserProfileResponse;
import com.vvu981.colivibackend.features.user.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HomeExpenseMapperTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private HomeExpenseMapper mapper;

    private User user;
    private UserProfileResponse userDto;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        
        userDto = new UserProfileResponse();
    }

    @Test
    void toExpenseResponseDto() {
        Home home = new Home();
        home.setId(UUID.randomUUID());

        HomeExpense expense = new HomeExpense();
        expense.setId(UUID.randomUUID());
        expense.setHome(home);
        expense.setPayer(user);
        expense.setDescription("Test");
        expense.setTotalAmount(new BigDecimal("10.00"));
        expense.setCreatedAt(LocalDateTime.now());

        HomeExpenseParticipant participant = new HomeExpenseParticipant();
        participant.setId(UUID.randomUUID());
        participant.setUser(user);
        participant.setOwedAmount(new BigDecimal("10.00"));
        expense.addParticipant(participant);

        when(userMapper.toUserProfileDto(user)).thenReturn(userDto);

        ExpenseResponseDto dto = mapper.toExpenseResponseDto(expense);

        assertEquals(expense.getId(), dto.id());
        assertEquals("Test", dto.description());
        assertEquals(new BigDecimal("10.00"), dto.totalAmount());
        assertEquals(1, dto.participants().size());
        assertEquals(userDto, dto.payer());
    }

    @Test
    void toParticipantResponseDto() {
        HomeExpenseParticipant participant = new HomeExpenseParticipant();
        participant.setId(UUID.randomUUID());
        participant.setUser(user);
        participant.setOwedAmount(new BigDecimal("5.00"));

        when(userMapper.toUserProfileDto(user)).thenReturn(userDto);

        ExpenseParticipantResponseDto dto = mapper.toParticipantResponseDto(participant);

        assertEquals(participant.getId(), dto.id());
        assertEquals(userDto, dto.user());
        assertEquals(new BigDecimal("5.00"), dto.owedAmount());
    }

    @Test
    void toBalanceResponseDto() {
        Balance balance = new Balance(userId, new BigDecimal("100.00"));
        when(userMapper.toUserProfileDto(user)).thenReturn(userDto);

        BalanceResponseDto dto = mapper.toBalanceResponseDto(balance, Map.of(userId, user));

        assertEquals(userDto, dto.user());
        assertEquals(new BigDecimal("100.00"), dto.amount());
    }

    @Test
    void toDebtTransferResponseDto() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        User fromUser = new User();
        fromUser.setId(fromId);
        User toUser = new User();
        toUser.setId(toId);
        
        UserProfileResponse fromDto = new UserProfileResponse();
        UserProfileResponse toDto = new UserProfileResponse();

        DebtTransfer transfer = new DebtTransfer(fromId, toId, new BigDecimal("50.00"));

        when(userMapper.toUserProfileDto(fromUser)).thenReturn(fromDto);
        when(userMapper.toUserProfileDto(toUser)).thenReturn(toDto);

        DebtTransferResponseDto dto = mapper.toDebtTransferResponseDto(transfer, Map.of(fromId, fromUser, toId, toUser));

        assertEquals(fromDto, dto.fromUser());
        assertEquals(toDto, dto.toUser());
        assertEquals(new BigDecimal("50.00"), dto.amount());
    }
}
