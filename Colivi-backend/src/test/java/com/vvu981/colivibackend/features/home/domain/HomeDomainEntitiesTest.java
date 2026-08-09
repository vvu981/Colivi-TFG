package com.vvu981.colivibackend.features.home.domain;

import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class HomeDomainEntitiesTest {

    @Test
    @DisplayName("should CoverHomeGettersAndSetters")
    void shouldCoverHomeGettersAndSetters() {
        Home home = new Home();
        UUID id = UUID.randomUUID();
        home.setId(id);
        home.setName("My Home");
        home.setInvitationCode("CODE123");
        home.setCreatedAt(LocalDateTime.now());
        home.setDeletedAt(LocalDateTime.now());
        home.setMembers(new ArrayList<>());
        

        assertNotNull(home.getMembers());
        
        HomeMember member = new HomeMember();
        home.addMember(member);
        assertEquals(1, home.getMembers().size());
        assertEquals(home, member.getHome());
        
        home.removeMember(member);
        assertEquals(0, home.getMembers().size());
        assertNull(member.getHome());
        
        home.softDelete();
        assertNotNull(home.getDeletedAt());
        
        home.onCreate();
        assertNotNull(home.getCreatedAt());
        
        Home home2 = new Home(id, "Test", "CODE", new ArrayList<>(), LocalDateTime.now(), null);
        assertEquals(id, home2.getId());
    }

    @Test
    @DisplayName("should CoverHomeExpenseGettersAndSetters")
    void shouldCoverHomeExpenseGettersAndSetters() {
        HomeExpense expense = new HomeExpense();
        UUID id = UUID.randomUUID();
        User payer = new User();
        Home home = new Home();
        
        expense.setId(id);
        expense.setHome(home);
        expense.setPayer(payer);
        expense.setDescription("Test");
        expense.setTotalAmount(BigDecimal.TEN);
        expense.setCreatedAt(LocalDateTime.now());
        expense.setDeletedAt(LocalDateTime.now());
        expense.setParticipants(new ArrayList<>());
        
        assertEquals(id, expense.getId());
        assertEquals(home, expense.getHome());
        assertEquals(payer, expense.getPayer());
        assertEquals("Test", expense.getDescription());
        assertEquals(BigDecimal.TEN, expense.getTotalAmount());
        assertNotNull(expense.getCreatedAt());
        assertNotNull(expense.getDeletedAt());
        assertNotNull(expense.getParticipants());
        
        HomeExpenseParticipant part = new HomeExpenseParticipant();
        expense.addParticipant(part);
        assertEquals(1, expense.getParticipants().size());
        assertEquals(expense, part.getExpense());
        
        expense.removeParticipant(part);
        assertEquals(0, expense.getParticipants().size());
        assertNull(part.getExpense());
        
        expense.softDelete();
        assertNotNull(expense.getDeletedAt());
    }

    @Test
    @DisplayName("should CoverHomeMemberMethods")
    void shouldCoverHomeMemberMethods() {
        HomeMember member = new HomeMember();
        UUID id = UUID.randomUUID();
        User user = new User();
        Home home = new Home();
        
        member.setId(id);
        member.setUser(user);
        member.setHome(home);
        member.setRole(HomeRole.ADMIN);
        member.setStatus(HomeMemberStatus.LEFT);
        member.setJoinedAt(LocalDateTime.now());
        member.setLeftAt(LocalDateTime.now());
        
        assertEquals(id, member.getId());
        assertEquals(user, member.getUser());
        assertEquals(home, member.getHome());
        assertEquals(HomeRole.ADMIN, member.getRole());
        assertEquals(HomeMemberStatus.LEFT, member.getStatus());
        assertNotNull(member.getJoinedAt());
        assertNotNull(member.getLeftAt());
        
        member.onCreate();
        assertNotNull(member.getJoinedAt());
        
        member.leave();
        assertEquals(HomeMemberStatus.LEFT, member.getStatus());
        assertNotNull(member.getLeftAt());
        
        member.archive();
        assertEquals(HomeMemberStatus.ARCHIVED, member.getStatus());
        
        member.reactivate();
        assertEquals(HomeMemberStatus.ACTIVE, member.getStatus());
        assertEquals(HomeRole.MEMBER, member.getRole());
        assertNotNull(member.getJoinedAt());
        assertNull(member.getLeftAt());
        
        member.unarchive();
        assertEquals(HomeMemberStatus.LEFT, member.getStatus());
        
        HomeMember member2 = new HomeMember(id, home, user, HomeRole.MEMBER, LocalDateTime.now(), null, HomeMemberStatus.ACTIVE);
        assertEquals(id, member2.getId());
    }

    @Test
    @DisplayName("should CoverActivityLogMethods")
    void shouldCoverActivityLogMethods() {
        ActivityLog log = new ActivityLog();
        UUID id = UUID.randomUUID();
        User actor = new User();
        Home home = new Home();
        Map<String, Object> meta = new HashMap<>();
        
        log.setId(id);
        log.setHome(home);
        log.setActor(actor);
        log.setActivityType(ActivityType.MEMBER_JOINED);
        log.setDescription("Desc");
        log.setMetadata(meta);
        log.setCreatedAt(LocalDateTime.now());
        
        assertEquals(id, log.getId());
        assertEquals(home, log.getHome());
        assertEquals(actor, log.getActor());
        assertEquals(ActivityType.MEMBER_JOINED, log.getActivityType());
        assertEquals("Desc", log.getDescription());
        assertEquals(meta, log.getMetadata());
        assertNotNull(log.getCreatedAt());
        
        log.setCreatedAt(null);
        log.onCreate();
        assertNotNull(log.getCreatedAt());
        
        assertThrows(UnsupportedOperationException.class, () -> log.preventModification());
        
        ActivityLog log2 = new ActivityLog(id, home, actor, ActivityType.MEMBER_LEFT, "D", meta, LocalDateTime.now());
        assertEquals(id, log2.getId());
    }
}
