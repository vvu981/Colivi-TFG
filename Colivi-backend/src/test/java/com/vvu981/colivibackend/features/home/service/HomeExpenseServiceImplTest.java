package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
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
import org.springframework.context.ApplicationEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HomeExpenseServiceImplTest {

    @Mock
    private HomeExpenseRepository expenseRepository;
    @Mock
    private HomeRepository homeRepository;
    @Mock
    private HomeMemberRepository memberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private HomeExpenseMapper expenseMapper;
    @Mock
    private DebtSimplifierService debtSimplifierService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private HomeExpenseServiceImpl service;

    @Captor
    private ArgumentCaptor<HomeExpense> expenseCaptor;

    private UUID homeId;
    private UUID payerId;
    private UUID participant1Id;
    private UUID participant2Id;
    private User payer;
    private User participant1;
    private User participant2;
    private Home home;

    @BeforeEach
    void setUp() {
        homeId = UUID.randomUUID();
        payerId = UUID.randomUUID();
        participant1Id = UUID.randomUUID();
        participant2Id = UUID.randomUUID();

        payer = new User();
        payer.setId(payerId);
        payer.setRole(UserRole.USER);

        participant1 = new User();
        participant1.setId(participant1Id);

        participant2 = new User();
        participant2.setId(participant2Id);

        home = new Home();
        home.setId(homeId);
    }

    private void mockActiveMember(UUID hId, UUID uId) {
        HomeMember member = new HomeMember();
        member.setStatus(HomeMemberStatus.ACTIVE);
        when(memberRepository.findByHomeIdAndUserId(hId, uId)).thenReturn(Optional.of(member));
    }

    private void mockActiveMembersList(UUID hId, User... users) {
        List<HomeMember> members = java.util.Arrays.stream(users).map(u -> {
            HomeMember m = new HomeMember();
            m.setUser(u);
            m.setStatus(HomeMemberStatus.ACTIVE);
            return m;
        }).toList();
        when(memberRepository.findByHomeIdAndStatus(hId, HomeMemberStatus.ACTIVE)).thenReturn(members);
    }

    @Nested
    class CreateExpense {

        @Test
        void createExpense_Success_ExactDivision() {
            mockActiveMember(homeId, payerId);
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            mockActiveMembersList(homeId, payer, participant1);

            when(userRepository.findActiveById(payerId)).thenReturn(Optional.of(payer));
            when(userRepository.findAllById(any())).thenReturn(List.of(payer, participant1));

            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId,
                    List.of(payerId, participant1Id));

            service.createExpense(homeId, request, payerId);

            verify(expenseRepository).save(expenseCaptor.capture());
            HomeExpense saved = expenseCaptor.getValue();
            assertEquals(new BigDecimal("100.00"), saved.getTotalAmount());
            assertEquals(2, saved.getParticipants().size());

            // 50.00 each
            assertEquals(new BigDecimal("50.00"), saved.getParticipants().get(0).getOwedAmount());
            assertEquals(new BigDecimal("50.00"), saved.getParticipants().get(1).getOwedAmount());
        }

        @Test
        void createExpense_Success_InexactDivision_NoCentsLost() {
            mockActiveMember(homeId, payerId);
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            mockActiveMembersList(homeId, payer, participant1, participant2);

            when(userRepository.findActiveById(payerId)).thenReturn(Optional.of(payer));
            when(userRepository.findAllById(any())).thenReturn(List.of(payer, participant1, participant2));

            // 100.00 / 3 = 33.333...
            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId,
                    List.of(payerId, participant1Id, participant2Id));

            service.createExpense(homeId, request, payerId);

            verify(expenseRepository).save(expenseCaptor.capture());
            HomeExpense saved = expenseCaptor.getValue();
            assertEquals(new BigDecimal("100.00"), saved.getTotalAmount());
            assertEquals(3, saved.getParticipants().size());

            // First participant gets 33.34, others 33.33
            assertEquals(new BigDecimal("33.34"), saved.getParticipants().get(0).getOwedAmount());
            assertEquals(new BigDecimal("33.33"), saved.getParticipants().get(1).getOwedAmount());
            assertEquals(new BigDecimal("33.33"), saved.getParticipants().get(2).getOwedAmount());
        }

        @Test
        void createExpense_InactiveParticipant_ThrowsException() {
            mockActiveMember(homeId, payerId);
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            // Only payer is active
            mockActiveMembersList(homeId, payer);

            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId,
                    List.of(payerId, participant1Id));

            assertThrows(BusinessRuleValidationException.class, () -> service.createExpense(homeId, request, payerId));
        }

        @Test
        void createExpense_NotMember_ThrowsException() {
            when(memberRepository.findByHomeIdAndUserId(homeId, payerId)).thenReturn(Optional.empty());
            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId,
                    List.of(payerId));

            assertThrows(UnauthorizedActionException.class, () -> service.createExpense(homeId, request, payerId));
        }

        @Test
        void createExpense_MemberInactive_ThrowsException() {
            HomeMember member = new HomeMember();
            member.setStatus(HomeMemberStatus.LEFT);
            when(memberRepository.findByHomeIdAndUserId(homeId, payerId)).thenReturn(Optional.of(member));
            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId,
                    List.of(payerId));

            assertThrows(UnauthorizedActionException.class, () -> service.createExpense(homeId, request, payerId));
        }

        @Test
        void createExpense_HomeNotFound_ThrowsException() {
            mockActiveMember(homeId, payerId);
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.empty());

            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId, List.of(payerId));
            assertThrows(com.vvu981.colivibackend.core.exception.ResourceNotFoundException.class, () -> service.createExpense(homeId, request, payerId));
        }

        @Test
        void createExpense_UserNotFound_ThrowsException() {
            mockActiveMember(homeId, payerId);
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            mockActiveMembersList(homeId, payer, participant1);

            when(userRepository.findActiveById(payerId)).thenReturn(Optional.of(payer));
            // Simula que no se encontraron todos los usuarios (ej. findAllById devuelve 1 en vez de 2)
            when(userRepository.findAllById(any())).thenReturn(List.of(payer));

            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId, List.of(payerId, participant1Id));
            assertThrows(com.vvu981.colivibackend.core.exception.ResourceNotFoundException.class, () -> service.createExpense(homeId, request, payerId));
        }
    }

    @Nested
    class DeleteExpense {
        private UUID expenseId;
        private HomeExpense expense;

        @BeforeEach
        void setUpDelete() {
            expenseId = UUID.randomUUID();
            expense = new HomeExpense();
            expense.setId(expenseId);
            expense.setHome(home);
            expense.setPayer(payer);
        }

        @Test
        void deleteExpense_AsPayer_Success() {
            when(expenseRepository.findByIdAndDeletedAtIsNull(expenseId)).thenReturn(Optional.of(expense));
            when(userRepository.findActiveById(payerId)).thenReturn(Optional.of(payer));

            service.deleteExpense(homeId, expenseId, payerId);

            verify(expenseRepository).save(expense);
            assertNotNull(expense.getDeletedAt());
        }

        @Test
        void deleteExpense_AsSystemAdmin_Success() {
            User admin = new User();
            admin.setId(UUID.randomUUID());
            admin.setRole(UserRole.ADMIN);

            when(expenseRepository.findByIdAndDeletedAtIsNull(expenseId)).thenReturn(Optional.of(expense));
            when(userRepository.findActiveById(admin.getId())).thenReturn(Optional.of(admin));

            service.deleteExpense(homeId, expenseId, admin.getId());

            verify(expenseRepository).save(expense);
            assertNotNull(expense.getDeletedAt());
        }

        @Test
        void deleteExpense_AsHomeAdmin_Success() {
            User homeAdmin = new User();
            homeAdmin.setId(UUID.randomUUID());
            homeAdmin.setRole(UserRole.USER);

            HomeMember adminMember = new HomeMember();
            adminMember.setStatus(HomeMemberStatus.ACTIVE);
            adminMember.setRole(HomeRole.ADMIN);

            when(expenseRepository.findByIdAndDeletedAtIsNull(expenseId)).thenReturn(Optional.of(expense));
            when(userRepository.findActiveById(homeAdmin.getId())).thenReturn(Optional.of(homeAdmin));
            when(memberRepository.findByHomeIdAndUserId(homeId, homeAdmin.getId()))
                    .thenReturn(Optional.of(adminMember));

            service.deleteExpense(homeId, expenseId, homeAdmin.getId());

            verify(expenseRepository).save(expense);
            assertNotNull(expense.getDeletedAt());
        }

        @Test
        void deleteExpense_Unauthorized_ThrowsException() {
            User randomUser = new User();
            randomUser.setId(UUID.randomUUID());
            randomUser.setRole(UserRole.USER);

            HomeMember randomMember = new HomeMember();
            randomMember.setStatus(HomeMemberStatus.ACTIVE);
            randomMember.setRole(HomeRole.MEMBER);

            when(expenseRepository.findByIdAndDeletedAtIsNull(expenseId)).thenReturn(Optional.of(expense));
            when(userRepository.findActiveById(randomUser.getId())).thenReturn(Optional.of(randomUser));
            when(memberRepository.findByHomeIdAndUserId(homeId, randomUser.getId()))
                    .thenReturn(Optional.of(randomMember));

            assertThrows(UnauthorizedActionException.class,
                    () -> service.deleteExpense(homeId, expenseId, randomUser.getId()));
        }

        @Test
        void deleteExpense_ExpenseNotFound_ThrowsException() {
            when(expenseRepository.findByIdAndDeletedAtIsNull(expenseId)).thenReturn(Optional.empty());

            assertThrows(com.vvu981.colivibackend.core.exception.ResourceNotFoundException.class, 
                () -> service.deleteExpense(homeId, expenseId, payerId));
        }

        @Test
        void deleteExpense_ExpenseBelongsToDifferentHome_ThrowsException() {
            Home otherHome = new Home();
            otherHome.setId(UUID.randomUUID());
            expense.setHome(otherHome);

            when(expenseRepository.findByIdAndDeletedAtIsNull(expenseId)).thenReturn(Optional.of(expense));

            assertThrows(com.vvu981.colivibackend.core.exception.ResourceNotFoundException.class,
                () -> service.deleteExpense(homeId, expenseId, payerId));
        }
    }

    @Nested
    class QueryServices {

        @Test
        void getHomeExpenses_Success() {
            mockActiveMember(homeId, payerId);
            HomeExpense expense = new HomeExpense();
            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of(expense));
            when(expenseMapper.toExpenseResponseDto(expense)).thenReturn(null); // mock response

            List<ExpenseResponseDto> result = service.getHomeExpenses(homeId, payerId);

            assertEquals(1, result.size());
        }

        @Test
        void getHomeExpenses_AsLeftMember_Success() {
            HomeMember leftMember = new HomeMember();
            leftMember.setStatus(HomeMemberStatus.LEFT);
            when(memberRepository.findByHomeIdAndUserId(homeId, payerId)).thenReturn(Optional.of(leftMember));
            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of());

            List<ExpenseResponseDto> result = service.getHomeExpenses(homeId, payerId);
            assertNotNull(result);
        }

        @Test
        void getHomeExpenses_InactiveMember_ThrowsUnauthorized() {
            HomeMember bannedMember = new HomeMember();
            bannedMember.setStatus(HomeMemberStatus.ARCHIVED);
            when(memberRepository.findByHomeIdAndUserId(homeId, payerId)).thenReturn(Optional.of(bannedMember));

            assertThrows(UnauthorizedActionException.class, () -> service.getHomeExpenses(homeId, payerId));
        }

        @Test
        void getHomeBalances_Success() {
            mockActiveMember(homeId, payerId);
            HomeExpense expense = new HomeExpense();
            expense.setPayer(payer);
            expense.setTotalAmount(new BigDecimal("100.00"));

            HomeExpenseParticipant p1 = new HomeExpenseParticipant();
            p1.setUser(payer);
            p1.setOwedAmount(new BigDecimal("50.00"));

            HomeExpenseParticipant p2 = new HomeExpenseParticipant();
            p2.setUser(participant1);
            p2.setOwedAmount(new BigDecimal("50.00"));

            expense.addParticipant(p1);
            expense.addParticipant(p2);

            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of(expense));
            when(userRepository.findAllById(any())).thenReturn(List.of(payer, participant1));

            List<BalanceResponseDto> result = service.getHomeBalances(homeId, payerId);

            assertEquals(2, result.size());
        }

        @Test
        void getOptimizedTransfers_Success() {
            mockActiveMember(homeId, payerId);
            HomeExpense expense = new HomeExpense();
            expense.setPayer(payer);
            expense.setTotalAmount(new BigDecimal("100.00"));

            HomeExpenseParticipant p2 = new HomeExpenseParticipant();
            p2.setUser(participant1);
            p2.setOwedAmount(new BigDecimal("100.00"));

            expense.addParticipant(p2);

            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of(expense));

            DebtTransfer transfer = new DebtTransfer(participant1Id, payerId, new BigDecimal("100.00"));
            when(debtSimplifierService.simplify(any())).thenReturn(List.of(transfer));
            when(userRepository.findAllById(any())).thenReturn(List.of(payer, participant1));

            List<DebtTransferResponseDto> result = service.getOptimizedTransfers(homeId, payerId);

            assertEquals(1, result.size());
        }

        @Test
        void getUserBalance_Success() {
            HomeExpense expense = new HomeExpense();
            expense.setPayer(payer);
            expense.setTotalAmount(new BigDecimal("100.00"));

            HomeExpenseParticipant p1 = new HomeExpenseParticipant();
            p1.setUser(payer);
            p1.setOwedAmount(new BigDecimal("50.00"));

            HomeExpenseParticipant p2 = new HomeExpenseParticipant();
            p2.setUser(participant1);
            p2.setOwedAmount(new BigDecimal("50.00"));

            expense.addParticipant(p1);
            expense.addParticipant(p2);

            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of(expense));

            BigDecimal balance = service.getUserBalance(homeId, payerId);

            assertEquals(0, new BigDecimal("50.00").compareTo(balance)); // Paid 100, owes 50 -> +50
        }

        @Test
        void getUserBalance_ZeroWhenUserNotInExpenses() {
            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of());

            BigDecimal balance = service.getUserBalance(homeId, UUID.randomUUID());

            assertEquals(BigDecimal.ZERO, balance);
        }

        @Test
        void getHomeExpenses_Success_WhenMemberIsLeft() {
            HomeMember member = new HomeMember();
            member.setStatus(HomeMemberStatus.LEFT);
            when(memberRepository.findByHomeIdAndUserId(homeId, payerId)).thenReturn(Optional.of(member));
            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of());

            List<ExpenseResponseDto> result = service.getHomeExpenses(homeId, payerId);

            assertNotNull(result);
        }

        @Test
        void deleteExpense_Success_ByHomeAdmin() {
            HomeExpense expense = new HomeExpense();
            expense.setHome(home);
            expense.setPayer(payer);
            expense.setDescription("Test Expense");
            when(expenseRepository.findByIdAndDeletedAtIsNull(expense.getId())).thenReturn(Optional.of(expense));

            User adminUser = new User();
            adminUser.setId(UUID.randomUUID());
            adminUser.setRole(UserRole.USER);
            when(userRepository.findActiveById(adminUser.getId())).thenReturn(Optional.of(adminUser));

            HomeMember homeAdminMember = new HomeMember();
            homeAdminMember.setStatus(HomeMemberStatus.ACTIVE);
            homeAdminMember.setRole(HomeRole.ADMIN);
            when(memberRepository.findByHomeIdAndUserId(homeId, adminUser.getId())).thenReturn(Optional.of(homeAdminMember));

            service.deleteExpense(homeId, expense.getId(), adminUser.getId());

            assertNotNull(expense.getDeletedAt());
            verify(expenseRepository).save(expense);
        }

        @Test
        void deleteExpense_Success_BySystemAdmin() {
            HomeExpense expense = new HomeExpense();
            expense.setHome(home);
            expense.setPayer(payer);
            expense.setDescription("Test Expense");
            when(expenseRepository.findByIdAndDeletedAtIsNull(expense.getId())).thenReturn(Optional.of(expense));

            User systemAdmin = new User();
            systemAdmin.setId(UUID.randomUUID());
            systemAdmin.setRole(UserRole.ADMIN);
            when(userRepository.findActiveById(systemAdmin.getId())).thenReturn(Optional.of(systemAdmin));

            service.deleteExpense(homeId, expense.getId(), systemAdmin.getId());

            assertNotNull(expense.getDeletedAt());
            verify(expenseRepository).save(expense);
        }

        @Test
        void createExpense_ThrowsIfPayerNotFound() {
            mockActiveMember(homeId, payerId);
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            mockActiveMembersList(homeId, payer, participant1);

            when(userRepository.findActiveById(payerId)).thenReturn(Optional.empty());

            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId,
                    List.of(payerId, participant1Id));

            assertThrows(com.vvu981.colivibackend.core.exception.ResourceNotFoundException.class,
                    () -> service.createExpense(homeId, request, payerId));
        }

        @Test
        void createExpense_ThrowsIfParticipantUserIsDeleted() {
            mockActiveMember(homeId, payerId);
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            mockActiveMembersList(homeId, payer, participant1);

            when(userRepository.findActiveById(payerId)).thenReturn(Optional.of(payer));

            User deletedParticipant = new User();
            deletedParticipant.setId(participant1Id);
            deletedParticipant.setDeletedAt(java.time.LocalDateTime.now());
            when(userRepository.findAllById(any())).thenReturn(List.of(payer, deletedParticipant));

            CreateExpenseRequest request = new CreateExpenseRequest("Test", new BigDecimal("100.00"), payerId,
                    List.of(payerId, participant1Id));

            assertThrows(com.vvu981.colivibackend.core.exception.ResourceNotFoundException.class,
                    () -> service.createExpense(homeId, request, payerId));
        }

        @Test
        void deleteExpense_ThrowsIfRequestUserNotFound() {
            HomeExpense expense = new HomeExpense();
            expense.setHome(home);
            expense.setPayer(payer);
            when(expenseRepository.findByIdAndDeletedAtIsNull(expense.getId())).thenReturn(Optional.of(expense));

            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.findActiveById(unknownUserId)).thenReturn(Optional.empty());

            assertThrows(com.vvu981.colivibackend.core.exception.ResourceNotFoundException.class,
                    () -> service.deleteExpense(homeId, expense.getId(), unknownUserId));
        }

        @Test
        void getHomeExpenses_ThrowsIfCallerNotMember() {
            when(memberRepository.findByHomeIdAndUserId(homeId, payerId)).thenReturn(Optional.empty());

            assertThrows(UnauthorizedActionException.class, () -> service.getHomeExpenses(homeId, payerId));
        }

        @Test
        void getHomeBalances_FiltersOutZeroBalances() {
            mockActiveMember(homeId, payerId);

            HomeExpense expense = new HomeExpense();
            expense.setPayer(payer);
            expense.setTotalAmount(new BigDecimal("50.00"));

            // Payer owes 50.00 -> Net balance is 50.00 - 50.00 = 0.00
            HomeExpenseParticipant p1 = new HomeExpenseParticipant();
            p1.setUser(payer);
            p1.setOwedAmount(new BigDecimal("50.00"));
            expense.addParticipant(p1);

            when(expenseRepository.findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(homeId))
                    .thenReturn(List.of(expense));
            when(userRepository.findAllById(any())).thenReturn(List.of());

            List<BalanceResponseDto> result = service.getHomeBalances(homeId, payerId);

            assertTrue(result.isEmpty());
        }

        @Test
        void deleteExpense_ThrowsIfCallerIsMemberButNotAdminOrPayer() {
            HomeExpense expense = new HomeExpense();
            expense.setHome(home);
            expense.setPayer(payer);
            when(expenseRepository.findByIdAndDeletedAtIsNull(expense.getId())).thenReturn(Optional.of(expense));

            User regularUser = new User();
            regularUser.setId(UUID.randomUUID());
            regularUser.setRole(UserRole.USER);
            when(userRepository.findActiveById(regularUser.getId())).thenReturn(Optional.of(regularUser));

            HomeMember regularMember = new HomeMember();
            regularMember.setStatus(HomeMemberStatus.ACTIVE);
            regularMember.setRole(HomeRole.MEMBER);
            when(memberRepository.findByHomeIdAndUserId(homeId, regularUser.getId())).thenReturn(Optional.of(regularMember));

            assertThrows(UnauthorizedActionException.class,
                    () -> service.deleteExpense(homeId, expense.getId(), regularUser.getId()));
        }
    }
}
