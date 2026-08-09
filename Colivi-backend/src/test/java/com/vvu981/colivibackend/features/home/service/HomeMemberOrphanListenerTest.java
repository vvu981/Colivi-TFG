package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;
import com.vvu981.colivibackend.features.home.domain.event.AdminTransferredEvent;
import com.vvu981.colivibackend.features.home.domain.event.HomeDeletedEvent;
import com.vvu981.colivibackend.features.home.domain.event.MemberLeftEvent;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.event.UserDeletedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HomeMemberOrphanListenerTest {

    @Mock
    private HomeMemberRepository homeMemberRepository;

    @Mock
    private HomeRepository homeRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private HomeMemberOrphanListener listener;

    private User deletedUser;
    private UUID deletedUserId;
    private Home home;

    @BeforeEach
    void setUp() {
        deletedUserId = UUID.randomUUID();
        deletedUser = new User();
        deletedUser.setId(deletedUserId);
        deletedUser.setFirstName("Deleted");
        deletedUser.setLastName1("User");

        home = new Home();
        home.setId(UUID.randomUUID());
        home.setName("Test Home");
    }

    @Test
    @DisplayName("should do nothing when user has no active memberships")
    void shouldDoNothingWhenNoActiveMemberships() {
        // Arrange
        when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(deletedUserId)).thenReturn(Collections.emptyList());

        // Act
        listener.onUserDeleted(new UserDeletedEvent(deletedUserId, false));

        // Assert
        verify(homeMemberRepository, never()).save(any());
    }

    @Test
    @DisplayName("should skip processing if member status is not ACTIVE")
    void shouldSkipProcessingIfNotActive() {
        // Arrange
        HomeMember member = new HomeMember();
        member.setStatus(HomeMemberStatus.LEFT);
        
        when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(deletedUserId)).thenReturn(List.of(member));

        // Act
        listener.onUserDeleted(new UserDeletedEvent(deletedUserId, false));

        // Assert
        verify(homeMemberRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any(MemberLeftEvent.class));
    }

    @Test
    @DisplayName("should just leave if member is not ADMIN")
    void shouldJustLeaveIfNotAdmin() {
        // Arrange
        HomeMember member = new HomeMember();
        member.setUser(deletedUser);
        member.setHome(home);
        member.setStatus(HomeMemberStatus.ACTIVE);
        member.setRole(HomeRole.MEMBER);
        
        when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(deletedUserId)).thenReturn(List.of(member));

        // Act
        listener.onUserDeleted(new UserDeletedEvent(deletedUserId, false));

        // Assert
        verify(homeMemberRepository).save(member);
        verify(eventPublisher).publishEvent(any(MemberLeftEvent.class));
        verify(homeRepository, never()).save(any());
    }

    @Test
    @DisplayName("should soft delete home if member is the only one left")
    void shouldSoftDeleteHomeIfOnlyMemberLeft() {
        // Arrange
        HomeMember member = new HomeMember();
        member.setUser(deletedUser);
        member.setHome(home);
        member.setStatus(HomeMemberStatus.ACTIVE);
        member.setRole(HomeRole.ADMIN);
        
        when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(deletedUserId)).thenReturn(List.of(member));
        when(homeMemberRepository.countByHomeIdAndStatus(home.getId(), HomeMemberStatus.ACTIVE)).thenReturn(1L);

        // Act
        listener.onUserDeleted(new UserDeletedEvent(deletedUserId, false));

        // Assert
        verify(homeRepository).save(home);
        verify(eventPublisher).publishEvent(any(HomeDeletedEvent.class));
        verify(homeMemberRepository).save(member);
        verify(eventPublisher).publishEvent(any(MemberLeftEvent.class));
    }

    @Test
    @DisplayName("should just leave if is ADMIN but there is another ADMIN")
    void shouldJustLeaveIfAnotherAdminExists() {
        // Arrange
        HomeMember member = new HomeMember();
        member.setUser(deletedUser);
        member.setHome(home);
        member.setStatus(HomeMemberStatus.ACTIVE);
        member.setRole(HomeRole.ADMIN);
        
        when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(deletedUserId)).thenReturn(List.of(member));
        when(homeMemberRepository.countByHomeIdAndStatus(home.getId(), HomeMemberStatus.ACTIVE)).thenReturn(3L);
        when(homeMemberRepository.countByHomeIdAndRoleAndStatus(home.getId(), HomeRole.ADMIN, HomeMemberStatus.ACTIVE)).thenReturn(2L);

        // Act
        listener.onUserDeleted(new UserDeletedEvent(deletedUserId, false));

        // Assert
        verify(homeMemberRepository, never()).findByHomeIdAndStatus(any(), any());
        verify(homeMemberRepository).save(member);
    }

    @Test
    @DisplayName("should promote oldest member if is ONLY ADMIN and other members exist")
    void shouldPromoteOldestMemberIfOnlyAdminAndOthersExist() {
        // Arrange
        HomeMember member = new HomeMember();
        member.setUser(deletedUser);
        member.setHome(home);
        member.setStatus(HomeMemberStatus.ACTIVE);
        member.setRole(HomeRole.ADMIN);
        member.setJoinedAt(LocalDateTime.now().minusDays(10));
        
        User otherUser1 = new User();
        otherUser1.setId(UUID.randomUUID());
        otherUser1.setFirstName("Other");
        HomeMember otherMember1 = new HomeMember();
        otherMember1.setUser(otherUser1);
        otherMember1.setHome(home);
        otherMember1.setStatus(HomeMemberStatus.ACTIVE);
        otherMember1.setRole(HomeRole.MEMBER);
        otherMember1.setJoinedAt(LocalDateTime.now().minusDays(1)); // newer
        
        User otherUser2 = new User();
        otherUser2.setId(UUID.randomUUID());
        otherUser2.setFirstName("Other");
        HomeMember otherMember2 = new HomeMember();
        otherMember2.setUser(otherUser2);
        otherMember2.setHome(home);
        otherMember2.setStatus(HomeMemberStatus.ACTIVE);
        otherMember2.setRole(HomeRole.MEMBER);
        otherMember2.setJoinedAt(LocalDateTime.now().minusDays(5)); // older, should be promoted

        when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(deletedUserId)).thenReturn(List.of(member));
        when(homeMemberRepository.countByHomeIdAndStatus(home.getId(), HomeMemberStatus.ACTIVE)).thenReturn(3L);
        when(homeMemberRepository.countByHomeIdAndRoleAndStatus(home.getId(), HomeRole.ADMIN, HomeMemberStatus.ACTIVE)).thenReturn(1L);
        when(homeMemberRepository.findByHomeIdAndStatus(home.getId(), HomeMemberStatus.ACTIVE)).thenReturn(List.of(member, otherMember1, otherMember2));

        // Act
        listener.onUserDeleted(new UserDeletedEvent(deletedUserId, false));

        // Assert
        verify(homeMemberRepository).save(otherMember2);
        verify(eventPublisher).publishEvent(any(AdminTransferredEvent.class));
        verify(homeMemberRepository).save(member); // save leaving member
    }
    
    @Test
    @DisplayName("should not promote if no other eligible members found")
    void shouldNotPromoteIfNoEligibleMembersFound() {
        // Arrange
        HomeMember member = new HomeMember();
        member.setUser(deletedUser);
        member.setHome(home);
        member.setStatus(HomeMemberStatus.ACTIVE);
        member.setRole(HomeRole.ADMIN);
        
        when(homeMemberRepository.findByUserIdAndHomeDeletedAtIsNull(deletedUserId)).thenReturn(List.of(member));
        when(homeMemberRepository.countByHomeIdAndStatus(home.getId(), HomeMemberStatus.ACTIVE)).thenReturn(2L);
        when(homeMemberRepository.countByHomeIdAndRoleAndStatus(home.getId(), HomeRole.ADMIN, HomeMemberStatus.ACTIVE)).thenReturn(1L);
        when(homeMemberRepository.findByHomeIdAndStatus(home.getId(), HomeMemberStatus.ACTIVE)).thenReturn(List.of(member)); // Trampa: devuelve solo él

        // Act
        listener.onUserDeleted(new UserDeletedEvent(deletedUserId, false));

        // Assert
        verify(homeMemberRepository, times(1)).save(any()); // solo se guarda el leave
        verify(eventPublisher, never()).publishEvent(any(AdminTransferredEvent.class));
    }
}
