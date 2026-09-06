package com.vvu981.colivibackend.features.home.chore.mapper;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreResponseDto;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChoreMapperTest {

    private ChoreMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ChoreMapper();
    }

    @Test
    @DisplayName("toDto returns null when chore is null")
    void testToDtoNullChore() {
        assertNull(mapper.toDto(null, UUID.randomUUID(), LocalDate.now()));
        assertNull(mapper.toDto(null, UUID.randomUUID(), LocalDate.now(), "#FF0000"));
    }

    @Test
    @DisplayName("toDto with 3-arguments delegates with null color")
    void testToDtoThreeArgs() {
        Chore chore = new Chore();
        chore.setId(UUID.randomUUID());
        chore.setTitle("Clean");
        chore.setStatus(ChoreStatus.PENDING);
        chore.setDueDate(LocalDate.now());

        ChoreResponseDto dto = mapper.toDto(chore, null, null);
        assertNotNull(dto);
        assertEquals("#4F46E5", dto.assigneeColor()); // default color
    }

    @Test
    @DisplayName("toDto formats late chore where current user is assignee (canComplete=true, canRescue=false)")
    void testToDtoLateOwnChore() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setFirstName("Ana");
        user.setLastName1("García");
        user.setProfilePicUrl("http://pic.com/ana.png");

        Chore chore = new Chore();
        chore.setId(UUID.randomUUID());
        chore.setTitle("Platos");
        chore.setAssignee(user);
        chore.setStatus(ChoreStatus.PENDING);
        chore.setDueDate(LocalDate.now().minusDays(2)); // late

        ChoreResponseDto dto = mapper.toDto(chore, userId, LocalDate.now(), "#10B981");

        assertTrue(dto.isLate());
        assertFalse(dto.canRescue());
        assertTrue(dto.canComplete());
        assertEquals("Ana García", dto.assigneeName());
        assertEquals("#10B981", dto.assigneeColor());
    }

    @Test
    @DisplayName("toDto formats late chore where another user can rescue (canRescue=true, canComplete=true)")
    void testToDtoLateRescueChore() {
        UUID assigneeId = UUID.randomUUID();
        User assignee = new User();
        assignee.setId(assigneeId);
        assignee.setFirstName("Borja");
        assignee.setLastName1(null); // null lastName1 branch

        UUID currentUserId = UUID.randomUUID(); // different user

        Chore chore = new Chore();
        chore.setId(UUID.randomUUID());
        chore.setTitle("Basura");
        chore.setAssignee(assignee);
        chore.setStatus(ChoreStatus.PENDING);
        chore.setDueDate(LocalDate.now().minusDays(1));

        ChoreResponseDto dto = mapper.toDto(chore, currentUserId, LocalDate.now(), null);

        assertTrue(dto.isLate());
        assertTrue(dto.canRescue());
        assertTrue(dto.canComplete());
        assertEquals("Borja", dto.assigneeName());
        assertEquals("#4F46E5", dto.assigneeColor());
    }

    @Test
    @DisplayName("toDto handles unassigned chore and nickname fallback when names are blank")
    void testToDtoUnassignedAndNicknameFallback() {
        // Unassigned chore
        Chore unassigned = new Chore();
        unassigned.setId(UUID.randomUUID());
        unassigned.setTitle("Común");
        unassigned.setAssignee(null); // null assignee branch
        unassigned.setStatus(ChoreStatus.PENDING);
        unassigned.setDueDate(LocalDate.now().plusDays(2));

        ChoreResponseDto dto1 = mapper.toDto(unassigned, UUID.randomUUID(), LocalDate.now());
        assertEquals("Desconocido", dto1.assigneeName());
        assertFalse(dto1.isLate());
        assertFalse(dto1.canRescue());
        assertFalse(dto1.canComplete());

        // Assignee with blank first and last name -> fallback to nickname
        User userWithBlankNames = new User();
        userWithBlankNames.setId(UUID.randomUUID());
        userWithBlankNames.setNickname("gamer123");
        userWithBlankNames.setFirstName("");
        userWithBlankNames.setLastName1("");

        Chore choreBlankName = new Chore();
        choreBlankName.setId(UUID.randomUUID());
        choreBlankName.setAssignee(userWithBlankNames);
        choreBlankName.setStatus(ChoreStatus.PENDING);

        ChoreResponseDto dto2 = mapper.toDto(choreBlankName, null, null);
        assertEquals("gamer123", dto2.assigneeName());
    }

    @Test
    @DisplayName("toDto maps completedBy details including nickname fallback when names blank")
    void testToDtoCompletedByDetails() {
        User completer = new User();
        completer.setId(UUID.randomUUID());
        completer.setNickname("cleaner");
        completer.setFirstName("");
        completer.setLastName1(null);
        completer.setProfilePicUrl("http://avatar.com/1.jpg");

        Home home = new Home();
        home.setId(UUID.randomUUID());

        ChoreSeries series = new ChoreSeries();
        series.setId(UUID.randomUUID());

        Chore chore = new Chore();
        chore.setId(UUID.randomUUID());
        chore.setHome(home);
        chore.setSeries(series);
        chore.setStatus(ChoreStatus.COMPLETED);
        chore.setCompletedBy(completer);
        chore.setCompletedAt(LocalDateTime.now());
        chore.setDueDate(LocalDate.now().minusDays(1)); // completed, so isLate should be false

        ChoreResponseDto dto = mapper.toDto(chore, UUID.randomUUID(), LocalDate.now());

        assertFalse(dto.isLate()); // not pending
        assertFalse(dto.canComplete()); // not pending
        assertFalse(dto.canRescue());
        assertEquals("cleaner", dto.completedByName());
        assertEquals("http://avatar.com/1.jpg", dto.completedByAvatar());
        assertEquals(completer.getId(), dto.completedById());
        assertEquals(home.getId(), dto.homeId());
        assertEquals(series.getId(), dto.seriesId());

        // Completed with real first and last name
        completer.setFirstName("Carlos");
        completer.setLastName1("Sánchez");
        ChoreResponseDto dto2 = mapper.toDto(chore, UUID.randomUUID(), LocalDate.now());
        assertEquals("Carlos Sánchez", dto2.completedByName());
    }
}
