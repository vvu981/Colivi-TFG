package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;
import com.vvu981.colivibackend.features.home.dto.CreateHomeRequest;
import com.vvu981.colivibackend.features.home.dto.HomeDetailResponseDto;
import com.vvu981.colivibackend.features.home.dto.HomeResponseDto;
import com.vvu981.colivibackend.features.home.dto.JoinHomeRequest;
import com.vvu981.colivibackend.features.home.mapper.HomeMapper;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HomeServiceImplTest {

    @Mock
    private HomeRepository homeRepository;

    @Mock
    private HomeMemberRepository homeMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvitationCodeGenerator invitationCodeGenerator;

    @Mock
    private HomeBalanceValidator homeBalanceValidator;

    @Mock
    private HomeExpenseService homeExpenseService;

    private final HomeMapper homeMapper = new HomeMapper();

    private HomeServiceImpl homeService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        homeService = new HomeServiceImpl(
                homeRepository,
                homeMemberRepository,
                userRepository,
                invitationCodeGenerator,
                homeMapper,
                homeBalanceValidator,
                homeExpenseService
        );

        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setRole(UserRole.USER); // default role
        testUser.setFirstName("Víctor");
        testUser.setLastName1("García");
        testUser.setEmail("victor@test.com");
    }

    private Home buildHome(UUID homeId) {
        Home home = new Home();
        home.setId(homeId);
        home.setName("Casa Test");
        home.setInvitationCode("ABCD1234");
        home.setCreatedAt(LocalDateTime.now());
        home.setMembers(new ArrayList<>());
        return home;
    }

    private HomeMember buildMember(Home home, User user, HomeRole role, HomeMemberStatus status) {
        HomeMember member = new HomeMember();
        member.setId(UUID.randomUUID());
        member.setHome(home);
        member.setUser(user);
        member.setRole(role);
        member.setStatus(status);
        member.setJoinedAt(LocalDateTime.now());
        home.getMembers().add(member);
        return member;
    }

    // =========================================================================
    // createHome
    // =========================================================================

    @Nested
    class CreateHome {
        @Test
        void shouldCreateHomeWithGeneratedCodeAndAdminMember() {
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser));
            when(invitationCodeGenerator.generate()).thenReturn("TESTCODE");
            when(homeRepository.save(any(Home.class))).thenAnswer(inv -> inv.getArgument(0));

            HomeDetailResponseDto result = homeService.createHome(
                    new CreateHomeRequest("Casa de la Playa"), testUserId);

            assertNotNull(result);
            assertEquals(HomeRole.ADMIN, result.myRole());
        }

        @Test
        void shouldThrowIfUserNotFound() {
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId)).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, 
                () -> homeService.createHome(new CreateHomeRequest("Casa"), testUserId));
        }
    }

    // =========================================================================
    // getHomeDetail
    // =========================================================================
    
    @Nested
    class GetHomeDetail {
        @Test
        void shouldReturnDetailForActiveMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);
            
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId)).thenReturn(Optional.of(member));
            
            assertDoesNotThrow(() -> homeService.getHomeDetail(homeId, testUserId));
        }

        @Test
        void shouldReturnDetailForLeftMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.LEFT);
            
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId)).thenReturn(Optional.of(member));
            
            assertDoesNotThrow(() -> homeService.getHomeDetail(homeId, testUserId));
        }

        @Test
        void shouldThrowForArchivedMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ARCHIVED);
            
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId)).thenReturn(Optional.of(member));
            
            assertThrows(UnauthorizedActionException.class, () -> homeService.getHomeDetail(homeId, testUserId));
        }

        @Test
        void shouldThrowIfHomeNotFound() {
            UUID homeId = UUID.randomUUID();
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> homeService.getHomeDetail(homeId, testUserId));
        }
    }

    // =========================================================================
    // getUserHomes
    // =========================================================================

    @Nested
    class GetUserHomes {
        @Test
        void shouldReturnAllHomesWhenFilterIsNull() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(testUserId))
                .thenReturn(List.of(member));

            List<HomeResponseDto> result = homeService.getUserHomes(testUserId, null);
            assertEquals(1, result.size());
        }

        @Test
        void shouldReturnFilteredHomesWhenFilterIsProvided() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.LEFT);

            when(homeMemberRepository.findByUserIdAndStatusAndHomeDeletedAtIsNull(testUserId, HomeMemberStatus.LEFT))
                .thenReturn(List.of(member));

            List<HomeResponseDto> result = homeService.getUserHomes(testUserId, HomeMemberStatus.LEFT);
            assertEquals(1, result.size());
        }
    }

    // =========================================================================
    // joinHome
    // =========================================================================

    @Nested
    class JoinHome {
        @Test
        void shouldReactivateLeftMembershipWithMemberRole() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember leftAdmin = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.LEFT);
            leftAdmin.setLeftAt(LocalDateTime.now().minusDays(10));

            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser));
            when(homeRepository.findByInvitationCodeAndDeletedAtIsNull("ABCD1234"))
                    .thenReturn(Optional.of(home));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(leftAdmin));
            when(homeRepository.save(any(Home.class))).thenAnswer(inv -> inv.getArgument(0));

            HomeDetailResponseDto result = homeService.joinHome(
                    new JoinHomeRequest("ABCD1234"), testUserId);

            assertEquals(HomeMemberStatus.ACTIVE, result.myStatus());
            assertEquals(HomeRole.MEMBER, result.myRole(), "Debe recuperar rol MEMBER, no ADMIN");
        }

        @Test
        void shouldJoinAsNewMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);

            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser));
            when(homeRepository.findByInvitationCodeAndDeletedAtIsNull("CODE"))
                    .thenReturn(Optional.of(home));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.empty());
            when(homeRepository.save(any(Home.class))).thenAnswer(inv -> inv.getArgument(0));

            HomeDetailResponseDto result = homeService.joinHome(
                    new JoinHomeRequest("CODE"), testUserId);

            assertEquals(HomeRole.MEMBER, result.myRole());
            assertEquals(HomeMemberStatus.ACTIVE, result.myStatus());
        }

        @Test
        void shouldThrowWhenUserAlreadyActive() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember activeMember = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser));
            when(homeRepository.findByInvitationCodeAndDeletedAtIsNull("CODE"))
                    .thenReturn(Optional.of(home));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(activeMember));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.joinHome(new JoinHomeRequest("CODE"), testUserId));
        }

        @Test
        void shouldThrowWhenCodeNotFound() {
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId)).thenReturn(Optional.of(testUser));
            when(homeRepository.findByInvitationCodeAndDeletedAtIsNull("INVALID")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                () -> homeService.joinHome(new JoinHomeRequest("INVALID"), testUserId));
        }
    }

    // =========================================================================
    // leaveHome
    // =========================================================================

    @Nested
    class LeaveHome {
        @Test
        void shouldAutoSoftDeleteWhenUniqueAdminLeaves() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));

            homeService.leaveHome(homeId, testUserId);

            assertEquals(HomeMemberStatus.LEFT, adminMember.getStatus());
            assertNotNull(home.getDeletedAt(), "El hogar debe ser softDeleted");
            verify(homeRepository).save(home);
        }

        @Test
        void shouldThrowWhenAdminTriesToLeaveWithOtherActiveMembers() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User otherUser = new User();
            otherUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            buildMember(home, otherUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.leaveHome(homeId, testUserId));
            
            verify(homeRepository, never()).save(home);
        }

        @Test
        void shouldAllowAdminToLeaveWhenAnotherAdminExists() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User otherAdmin = new User();
            otherAdmin.setId(UUID.randomUUID());

            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            buildMember(home, otherAdmin, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));

            assertDoesNotThrow(() -> homeService.leaveHome(homeId, testUserId));
            assertEquals(HomeMemberStatus.LEFT, adminMember.getStatus());
        }

        @Test
        void shouldAllowRegularMemberToLeave() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(member));

            homeService.leaveHome(homeId, testUserId);
            assertEquals(HomeMemberStatus.LEFT, member.getStatus());
            verify(homeBalanceValidator).validateZeroBalance(homeId, testUserId);
        }

        @Test
        void shouldThrowIfCallerNotActiveMember() {
            UUID homeId = UUID.randomUUID();
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                .thenReturn(Optional.empty());

            assertThrows(UnauthorizedActionException.class, () -> homeService.leaveHome(homeId, testUserId));
        }
    }

    // =========================================================================
    // expelMember
    // =========================================================================

    @Nested
    class ExpelMember {
        @Test
        void shouldExpelActiveMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetMember = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetMember));

            homeService.expelMember(homeId, testUserId, targetUser.getId());

            assertEquals(HomeMemberStatus.LEFT, targetMember.getStatus());
            assertNotNull(targetMember.getLeftAt());
            verify(homeBalanceValidator).validateZeroBalance(homeId, targetUser.getId());
        }

        @Test
        void shouldThrowWhenExpellingSelf() {
            assertThrows(BusinessRuleValidationException.class, 
                    () -> homeService.expelMember(UUID.randomUUID(), testUserId, testUserId));
        }

        @Test
        void shouldThrowWhenExpellingInactiveMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetMember = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.LEFT);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetMember));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.expelMember(homeId, testUserId, targetUser.getId()));
        }

        @Test
        void shouldThrowWhenTargetNotFound() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> homeService.expelMember(homeId, testUserId, targetUser.getId()));
        }

        @Test
        void shouldThrowWhenExpellingMemberWithDebt() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetMember = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetMember));
            
            doThrow(new BusinessRuleValidationException("Deudas pendientes"))
                .when(homeBalanceValidator).validateZeroBalance(homeId, targetUser.getId());

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.expelMember(homeId, testUserId, targetUser.getId()));
        }
    }

    // =========================================================================
    // forceExpelWithDebtSettlement
    // =========================================================================

    @Nested
    class ForceExpelWithDebtSettlement {

        @Test
        void shouldForceExpelAndSettleDebtWhenUserOwesMoney() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetMember = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetMember));
            
            // Usuario debe 50€ (balance negativo)
            when(homeExpenseService.getUserBalance(homeId, targetUser.getId()))
                    .thenReturn(new java.math.BigDecimal("-50.00"));

            homeService.forceExpelWithDebtSettlement(homeId, testUserId, targetUser.getId(), "No paga");

            // Verifica que se crea un gasto donde Target paga y Admin consume
            verify(homeExpenseService).createExpense(eq(homeId), argThat(req -> 
                req.payerId().equals(targetUser.getId()) &&
                req.participantIds().contains(testUserId) &&
                req.totalAmount().compareTo(new java.math.BigDecimal("50.00")) == 0 &&
                req.description().contains("No paga")
            ), eq(testUserId));

            assertEquals(HomeMemberStatus.LEFT, targetMember.getStatus());
            assertNotNull(targetMember.getLeftAt());
            verify(homeBalanceValidator).validateZeroBalance(homeId, targetUser.getId());
        }

        @Test
        void shouldForceExpelAndSettleDebtWhenUserIsOwedMoney() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetMember = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetMember));
            
            // Le deben 30€ (balance positivo)
            when(homeExpenseService.getUserBalance(homeId, targetUser.getId()))
                    .thenReturn(new java.math.BigDecimal("30.00"));

            homeService.forceExpelWithDebtSettlement(homeId, testUserId, targetUser.getId(), null);

            // Verifica que se crea un gasto donde Admin paga y Target consume
            verify(homeExpenseService).createExpense(eq(homeId), argThat(req -> 
                req.payerId().equals(testUserId) &&
                req.participantIds().contains(targetUser.getId()) &&
                req.totalAmount().compareTo(new java.math.BigDecimal("30.00")) == 0
            ), eq(testUserId));

            assertEquals(HomeMemberStatus.LEFT, targetMember.getStatus());
            assertNotNull(targetMember.getLeftAt());
        }

        @Test
        void shouldForceExpelWithoutCreatingExpenseWhenBalanceIsZero() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetMember = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetMember));
            
            // Balance ya es 0
            when(homeExpenseService.getUserBalance(homeId, targetUser.getId()))
                    .thenReturn(java.math.BigDecimal.ZERO);

            homeService.forceExpelWithDebtSettlement(homeId, testUserId, targetUser.getId(), "Motivo");

            // No se debe crear gasto
            verify(homeExpenseService, never()).createExpense(any(), any(), any());

            assertEquals(HomeMemberStatus.LEFT, targetMember.getStatus());
            assertNotNull(targetMember.getLeftAt());
        }

        @Test
        void shouldThrowIfCallerNotAdmin() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());
            
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(member));

            assertThrows(UnauthorizedActionException.class, 
                () -> homeService.forceExpelWithDebtSettlement(homeId, testUserId, targetUser.getId(), "Motivo"));
        }
    }

    // =========================================================================
    // Archive / Unarchive
    // =========================================================================

    @Nested
    class ArchiveUnarchive {
        @Test
        void shouldArchiveFromLeftStatus() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember leftMember = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.LEFT);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(leftMember));

            homeService.archiveHomeView(homeId, testUserId);
            assertEquals(HomeMemberStatus.ARCHIVED, leftMember.getStatus());
        }

        @Test
        void shouldThrowWhenArchivingAnActiveHome() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember activeMember = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(activeMember));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.archiveHomeView(homeId, testUserId));
        }

        @Test
        void shouldThrowWhenArchivingAlreadyArchivedHome() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember archivedMember = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ARCHIVED);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(archivedMember));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.archiveHomeView(homeId, testUserId));
        }

        @Test
        void shouldUnarchiveFromArchivedStatus() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember archivedMember = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ARCHIVED);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(archivedMember));

            homeService.unarchiveHomeView(homeId, testUserId);
            assertEquals(HomeMemberStatus.LEFT, archivedMember.getStatus());
        }

        @Test
        void shouldThrowWhenUnarchivingNonArchivedHome() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember leftMember = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.LEFT);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(leftMember));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.unarchiveHomeView(homeId, testUserId));
        }

        @Test
        void shouldThrowIfMembershipNotFound() {
            UUID homeId = UUID.randomUUID();
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId)).thenReturn(Optional.empty());
            assertThrows(UnauthorizedActionException.class, () -> homeService.archiveHomeView(homeId, testUserId));
        }
    }

    // =========================================================================
    // transferAdmin
    // =========================================================================

    @Nested
    class TransferAdmin {
        @Test
        void shouldTransferAdminRoleToActiveMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());

            HomeMember currentAdmin = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetMember = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(currentAdmin));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetMember));

            homeService.transferAdmin(homeId, testUserId, targetUser.getId());

            assertEquals(HomeRole.MEMBER, currentAdmin.getRole());
            assertEquals(HomeRole.ADMIN, targetMember.getRole());
        }

        @Test
        void shouldThrowWhenTransferringToSelf() {
            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.transferAdmin(UUID.randomUUID(), testUserId, testUserId));
        }

        @Test
        void shouldThrowWhenCallerIsNotActiveAdmin() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());

            HomeMember regularMember = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(regularMember));

            assertThrows(UnauthorizedActionException.class,
                    () -> homeService.transferAdmin(homeId, testUserId, targetUser.getId()));
        }

        @Test
        void shouldThrowWhenCallerIsInactiveAdmin() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember leftAdmin = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.LEFT);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(leftAdmin));

            assertThrows(UnauthorizedActionException.class,
                    () -> homeService.transferAdmin(homeId, testUserId, UUID.randomUUID()));
        }

        @Test
        void shouldThrowWhenTargetNotActive() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());

            HomeMember currentAdmin = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember leftTarget = buildMember(home, targetUser, HomeRole.MEMBER, HomeMemberStatus.LEFT);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(currentAdmin));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(leftTarget));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.transferAdmin(homeId, testUserId, targetUser.getId()));
        }

        @Test
        void shouldThrowWhenTargetIsAlreadyAdmin() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());

            HomeMember currentAdmin = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            HomeMember targetAdmin = buildMember(home, targetUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(currentAdmin));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.of(targetAdmin));

            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.transferAdmin(homeId, testUserId, targetUser.getId()));
        }

        @Test
        void shouldThrowWhenTargetNotFound() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User targetUser = new User();
            targetUser.setId(UUID.randomUUID());

            HomeMember currentAdmin = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);

            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(currentAdmin));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, targetUser.getId()))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> homeService.transferAdmin(homeId, testUserId, targetUser.getId()));
        }
    }
    
    // =========================================================================
    // softDeleteHome
    // =========================================================================

    @Nested
    class SoftDeleteHome {
        @Test
        void shouldSoftDeleteIfSystemAdmin() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            testUser.setRole(UserRole.ADMIN); // System admin
            
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId))
                    .thenReturn(Optional.of(home));
            
            homeService.softDeleteHome(homeId, testUserId);
            assertNotNull(home.getDeletedAt());
        }

        @Test
        void shouldSoftDeleteIfHomeAdminAndUniqueMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser)); // UserRole.USER
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId))
                    .thenReturn(Optional.of(home));
            
            homeService.softDeleteHome(homeId, testUserId);
            assertNotNull(home.getDeletedAt());
        }

        @Test
        void shouldThrowIfHomeAdminButNotUniqueMember() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            User otherUser = new User();
            otherUser.setId(UUID.randomUUID());
            
            HomeMember adminMember = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.ACTIVE);
            buildMember(home, otherUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);
            
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser)); // UserRole.USER
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(adminMember));
            
            assertThrows(BusinessRuleValidationException.class,
                    () -> homeService.softDeleteHome(homeId, testUserId));
        }

        @Test
        void shouldThrowIfUserNotAdminOfHome() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.MEMBER, HomeMemberStatus.ACTIVE);
            
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser)); // UserRole.USER
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(member));
            
            assertThrows(UnauthorizedActionException.class,
                    () -> homeService.softDeleteHome(homeId, testUserId));
        }

        @Test
        void shouldThrowIfUserNotActiveInHome() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            HomeMember member = buildMember(home, testUser, HomeRole.ADMIN, HomeMemberStatus.LEFT);
            
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser)); // UserRole.USER
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.of(member));
            
            assertThrows(UnauthorizedActionException.class,
                    () -> homeService.softDeleteHome(homeId, testUserId));
        }

        @Test
        void shouldThrowIfMembershipNotFound() {
            UUID homeId = UUID.randomUUID();
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId))
                    .thenReturn(Optional.of(testUser)); // UserRole.USER
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, testUserId))
                    .thenReturn(Optional.empty());
            
            assertThrows(UnauthorizedActionException.class,
                    () -> homeService.softDeleteHome(homeId, testUserId));
        }
    }

    // =========================================================================
    // hardDeleteHome
    // =========================================================================

    @Nested
    class HardDeleteHome {
        @Test
        void shouldHardDeleteHomeIfSystemAdmin() {
            UUID homeId = UUID.randomUUID();
            Home home = buildHome(homeId);
            testUser.setRole(UserRole.ADMIN);
            
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId)).thenReturn(Optional.of(testUser));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(home));
            
            homeService.hardDeleteHome(homeId, testUserId);
            verify(homeRepository).delete(home);
        }

        @Test
        void shouldThrowIfUserNotSystemAdmin() {
            UUID homeId = UUID.randomUUID();
            testUser.setRole(UserRole.USER);
            
            when(userRepository.findByIdAndDeletedAtIsNull(testUserId)).thenReturn(Optional.of(testUser));
            
            assertThrows(UnauthorizedActionException.class, () -> homeService.hardDeleteHome(homeId, testUserId));
            verify(homeRepository, never()).delete(any(Home.class));
        }
    }
}
