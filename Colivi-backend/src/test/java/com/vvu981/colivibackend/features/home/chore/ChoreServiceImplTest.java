package com.vvu981.colivibackend.features.home.chore;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreCompletedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreDeletedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreRescuedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreSeriesCreatedEvent;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreFilterDto;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreLeaderboardDto;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreResponseDto;
import com.vvu981.colivibackend.features.home.chore.dto.CreateChoreRequest;
import com.vvu981.colivibackend.features.home.chore.dto.DeleteMode;
import com.vvu981.colivibackend.features.home.chore.mapper.ChoreMapper;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreRepository;
import com.vvu981.colivibackend.features.home.chore.service.ChorePointCalculator;
import com.vvu981.colivibackend.features.home.chore.service.ChoreServiceImpl;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreSeriesRepository;
import com.vvu981.colivibackend.features.home.chore.service.ChoreRotationService;
import com.vvu981.colivibackend.features.home.chore.service.ChoreRotationServiceImpl;
import com.vvu981.colivibackend.features.home.chore.service.strategy.ChoreAssignmentStrategyResolver;
import com.vvu981.colivibackend.features.home.chore.service.strategy.FixedAssigneeStrategy;
import com.vvu981.colivibackend.features.home.chore.service.strategy.RoundRobinRotationStrategy;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.domain.HomeRole;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChoreServiceImplTest {

    @Mock
    private ChoreRepository choreRepository;

    @Mock
    private ChoreSeriesRepository choreSeriesRepository;

    @Mock
    private HomeRepository homeRepository;

    @Mock
    private HomeMemberRepository homeMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ChoreMapper choreMapper;
    private ChorePointCalculator chorePointCalculator;
    private ChoreRotationService choreRotationService;
    private ChoreServiceImpl choreService;

    private UUID homeId;
    private UUID userAId;
    private UUID userBId;
    private Home testHome;
    private User userA;
    private User userB;
    private HomeMember memberA;
    private HomeMember memberB;

    @BeforeEach
    void setUp() {
        choreMapper = new ChoreMapper();
        chorePointCalculator = new ChorePointCalculator();

        ChoreAssignmentStrategyResolver strategyResolver = new ChoreAssignmentStrategyResolver(
                List.of(new FixedAssigneeStrategy(), new RoundRobinRotationStrategy())
        );
        choreRotationService = new ChoreRotationServiceImpl(
                choreSeriesRepository,
                choreRepository,
                userRepository,
                strategyResolver
        );

        choreService = new ChoreServiceImpl(
                choreRepository,
                homeRepository,
                homeMemberRepository,
                userRepository,
                choreMapper,
                chorePointCalculator,
                eventPublisher,
                choreRotationService
        );

        homeId = UUID.randomUUID();
        userAId = UUID.randomUUID();
        userBId = UUID.randomUUID();

        testHome = new Home();
        testHome.setId(homeId);
        testHome.setName("Piso Gran Vía");

        userA = new User();
        userA.setId(userAId);
        userA.setNickname("ana_g");
        userA.setFirstName("Ana");
        userA.setLastName1("García");

        userB = new User();
        userB.setId(userBId);
        userB.setNickname("borja_m");
        userB.setFirstName("Borja");
        userB.setLastName1("Martín");

        lenient().when(choreSeriesRepository.save(any(ChoreSeries.class))).thenAnswer(invocation -> {
            ChoreSeries s = invocation.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
            }
            return s;
        });

        lenient().when(userRepository.findAllById(any())).thenAnswer(invocation -> {
            Iterable<UUID> ids = invocation.getArgument(0);
            List<User> users = new ArrayList<>();
            for (UUID id : ids) {
                if (userAId != null && userAId.equals(id)) users.add(userA);
                else if (userBId != null && userBId.equals(id)) users.add(userB);
            }
            return users;
        });

        memberA = new HomeMember();
        memberA.setId(UUID.randomUUID());
        memberA.setHome(testHome);
        memberA.setUser(userA);
        memberA.setStatus(HomeMemberStatus.ACTIVE);
        memberA.setRole(HomeRole.ADMIN);

        memberB = new HomeMember();
        memberB.setId(UUID.randomUUID());
        memberB.setHome(testHome);
        memberB.setUser(userB);
        memberB.setStatus(HomeMemberStatus.ACTIVE);
        memberB.setRole(HomeRole.MEMBER);
    }

    @Nested
    @DisplayName("Creación de Tareas y Recurrencias")
    class CreateChoresTests {

        @Test
        @DisplayName("Debe crear una tarea única no recurrente exitosamente")
        void shouldCreateSingleChore() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(testHome));
            when(choreRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

            CreateChoreRequest request = new CreateChoreRequest(
                    "Limpiar cocina",
                    "Fregar encimera y suelo",
                    userAId,
                    15,
                    LocalDate.now().plusDays(2),
                    RecurrenceType.NONE,
                    1
            );

            List<ChoreResponseDto> result = choreService.createChore(homeId, request, userAId);

            assertEquals(1, result.size());
            ChoreResponseDto dto = result.get(0);
            assertEquals("Limpiar cocina", dto.title());
            assertEquals(15, dto.basePoints());
            assertEquals(ChoreStatus.PENDING, dto.status());
            assertNotNull(dto.seriesId());

            verify(eventPublisher).publishEvent(any(ChoreSeriesCreatedEvent.class));
        }

        @Test
        @DisplayName("Debe materializar físicamente N filas para tareas recurrentes compartiendo seriesId")
        void shouldMaterializeRecurringChores() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(testHome));
            when(choreRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

            LocalDate start = LocalDate.now();
            CreateChoreRequest request = new CreateChoreRequest(
                    "Sacar basura",
                    "Separar reciclaje",
                    userAId,
                    10,
                    start,
                    RecurrenceType.DAILY,
                    7
            );

            List<ChoreResponseDto> result = choreService.createChore(homeId, request, userAId);

            assertEquals(7, result.size());
            UUID seriesId = result.get(0).seriesId();
            assertNotNull(seriesId);

            for (int i = 0; i < 7; i++) {
                ChoreResponseDto chore = result.get(i);
                assertEquals(seriesId, chore.seriesId());
                assertEquals(start.plusDays(i), chore.dueDate());
                assertEquals(ChoreStatus.PENDING, chore.status());
            }

            verify(eventPublisher).publishEvent(any(ChoreSeriesCreatedEvent.class));
        }

        @Test
        @DisplayName("Debe materializar tareas en días personalizados de la semana (ej: Lunes, Martes y Jueves)")
        void shouldMaterializeCustomDaysOfWeekChores() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(testHome));
            when(choreRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

            // Base date is Monday, 7 Sept 2026
            LocalDate mondayStart = LocalDate.of(2026, 9, 7);
            CreateChoreRequest request = new CreateChoreRequest(
                    "Limpiar baño",
                    "Desinfectar lavabo y suelo",
                    userAId,
                    15,
                    mondayStart,
                    RecurrenceType.CUSTOM,
                    6,
                    List.of(1, 2, 4) // Lunes, Martes, Jueves
            );

            List<ChoreResponseDto> result = choreService.createChore(homeId, request, userAId);

            assertEquals(6, result.size());
            UUID seriesId = result.get(0).seriesId();
            assertNotNull(seriesId);

            // Verify generated dates: Mon 7, Tue 8, Thu 10, Mon 14, Tue 15, Thu 17
            List<LocalDate> expectedDates = List.of(
                    LocalDate.of(2026, 9, 7),
                    LocalDate.of(2026, 9, 8),
                    LocalDate.of(2026, 9, 10),
                    LocalDate.of(2026, 9, 14),
                    LocalDate.of(2026, 9, 15),
                    LocalDate.of(2026, 9, 17)
            );

            for (int i = 0; i < 6; i++) {
                assertEquals(expectedDates.get(i), result.get(i).dueDate());
                assertEquals(seriesId, result.get(i).seriesId());
                assertEquals(ChoreStatus.PENDING, result.get(i).status());
            }
        }

        @Test
        @DisplayName("Debe fallar si se selecciona CUSTOM sin días de la semana")
        void shouldFailIfCustomRecurrenceHasNoDays() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(testHome));

            CreateChoreRequest request = new CreateChoreRequest(
                    "Limpiar baño",
                    null,
                    userAId,
                    15,
                    LocalDate.now(),
                    RecurrenceType.CUSTOM,
                    5,
                    List.of()
            );

            assertThrows(BusinessRuleValidationException.class, () ->
                    choreService.createChore(homeId, request, userAId));
        }

        @Test
        @DisplayName("Debe fallar si el usuario que solicita crear no es miembro activo")
        void shouldFailIfRequesterIsNotActiveMember() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.empty());

            CreateChoreRequest request = new CreateChoreRequest(
                    "Pasar aspiradora", null, userAId, 10, LocalDate.now(), RecurrenceType.NONE, 1
            );

            assertThrows(UnauthorizedActionException.class, () ->
                    choreService.createChore(homeId, request, userAId));
        }

        @Test
        @DisplayName("Debe crear tareas rotativas asignando secuencialmente entre los participantes seleccionados")
        void shouldCreateRotatingChoresWithMultipleParticipants() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userBId)).thenReturn(Optional.of(memberB));
            when(homeRepository.findByIdAndDeletedAtIsNull(homeId)).thenReturn(Optional.of(testHome));
            when(choreRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

            LocalDate start = LocalDate.now();
            CreateChoreRequest request = new CreateChoreRequest(
                    "Limpiar salón",
                    "Aspirar alfombra",
                    null,
                    20,
                    start,
                    RecurrenceType.WEEKLY,
                    4,
                    null,
                    List.of(userAId, userBId),
                    RotationType.ROUND_ROBIN
            );

            List<ChoreResponseDto> result = choreService.createChore(homeId, request, userAId);

            assertEquals(4, result.size());
            assertEquals(userAId, result.get(0).assigneeId());
            assertEquals(userBId, result.get(1).assigneeId());
            assertEquals(userAId, result.get(2).assigneeId());
            assertEquals(userBId, result.get(3).assigneeId());
        }
    }

    @Nested
    @DisplayName("Listado y Filtrado de Tareas")
    class GetChoresTests {

        @Test
        @DisplayName("Obtiene tareas filtradas correctamente delegando a specifications")
        @SuppressWarnings("unchecked")
        void getChoresSuccessfully() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));

            Chore chore = new Chore();
            chore.setId(UUID.randomUUID());
            chore.setHome(testHome);
            chore.setAssignee(userA);
            chore.setTitle("Limpiar baño");
            chore.setBasePoints(10);
            chore.setDueDate(LocalDate.now());
            chore.setStatus(ChoreStatus.PENDING);

            when(choreRepository.findAll(any(Specification.class), any(Sort.class)))
                    .thenReturn(List.of(chore));

            ChoreFilterDto filter = new ChoreFilterDto(userAId, ChoreStatus.PENDING, null, null, null);
            List<ChoreResponseDto> result = choreService.getChores(homeId, filter, userAId);

            assertEquals(1, result.size());
            assertEquals("Limpiar baño", result.get(0).title());
            verify(choreRepository).findAll(any(Specification.class), any(Sort.class));
        }

        @Test
        @DisplayName("Filtra tareas atrasadas cuando period es LATE")
        @SuppressWarnings("unchecked")
        void getChoresLatePeriod() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));

            LocalDate today = LocalDate.now();

            Chore lateChore = new Chore();
            lateChore.setId(UUID.randomUUID());
            lateChore.setHome(testHome);
            lateChore.setAssignee(userA);
            lateChore.setTitle("Sacar basura");
            lateChore.setBasePoints(10);
            lateChore.setDueDate(today.minusDays(1));
            lateChore.setStatus(ChoreStatus.PENDING);

            Chore futureChore = new Chore();
            futureChore.setId(UUID.randomUUID());
            futureChore.setHome(testHome);
            futureChore.setAssignee(userA);
            futureChore.setTitle("Fregar platos");
            futureChore.setBasePoints(5);
            futureChore.setDueDate(today.plusDays(1));
            futureChore.setStatus(ChoreStatus.PENDING);

            when(choreRepository.findAll(any(Specification.class), any(Sort.class)))
                    .thenReturn(List.of(lateChore, futureChore));

            ChoreFilterDto filter = new ChoreFilterDto(null, null, null, null, "LATE");
            List<ChoreResponseDto> result = choreService.getChores(homeId, filter, userAId);

            assertEquals(1, result.size());
            assertEquals("Sacar basura", result.get(0).title());
        }
    }

    @Nested
    @DisplayName("Máquina de Puntos y Rescates")
    class CompleteAndRescueTests {

        @Test
        @DisplayName("Asignado completa a tiempo: estado COMPLETED y gana puntos base")
        void assigneeCompletesOnTime() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));
            when(userRepository.findActiveById(userAId)).thenReturn(Optional.of(userA));

            Chore chore = new Chore();
            chore.setId(UUID.randomUUID());
            chore.setHome(testHome);
            chore.setAssignee(userA);
            chore.setTitle("Barrer salón");
            chore.setBasePoints(10);
            chore.setDueDate(LocalDate.now()); // hoy -> a tiempo
            chore.setStatus(ChoreStatus.PENDING);

            when(choreRepository.findByIdAndHomeId(chore.getId(), homeId)).thenReturn(Optional.of(chore));
            when(choreRepository.save(any(Chore.class))).thenAnswer(inv -> inv.getArgument(0));

            ChoreResponseDto result = choreService.completeChore(homeId, chore.getId(), userAId);

            assertEquals(ChoreStatus.COMPLETED, result.status());
            assertEquals(userAId, result.completedById());
            assertNotNull(result.completedAt());

            ArgumentCaptor<ChoreCompletedEvent> eventCaptor = ArgumentCaptor.forClass(ChoreCompletedEvent.class);
            verify(eventPublisher).publishEvent(eventCaptor.capture());
            assertEquals(10, eventCaptor.getValue().pointsEarned());
        }

        @Test
        @DisplayName("Usuario no asignado intenta completar tarea a tiempo: se rechaza con error de negocio")
        void nonAssigneeCannotCompleteOnTimeChore() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userBId)).thenReturn(Optional.of(memberB));
            when(userRepository.findActiveById(userBId)).thenReturn(Optional.of(userB));

            Chore chore = new Chore();
            chore.setId(UUID.randomUUID());
            chore.setHome(testHome);
            chore.setAssignee(userA); // asignada a Ana
            chore.setTitle("Comprar detergente");
            chore.setBasePoints(10);
            chore.setDueDate(LocalDate.now().plusDays(1)); // fecha futura -> a tiempo
            chore.setStatus(ChoreStatus.PENDING);

            when(choreRepository.findByIdAndHomeId(chore.getId(), homeId)).thenReturn(Optional.of(chore));

            BusinessRuleValidationException ex = assertThrows(BusinessRuleValidationException.class, () ->
                    choreService.completeChore(homeId, chore.getId(), userBId)); // Borja intenta hacerla

            assertTrue(ex.getMessage().contains("Solo el usuario asignado puede completar la tarea antes de su vencimiento"));
            verify(choreRepository, never()).save(any());
        }

        @Test
        @DisplayName("El Rescate: Tarea atrasada completada por otro usuario -> LATE_COMPLETED, salvador gana puntos y asignado pierde")
        void rescueLateChoreByAnotherMember() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userBId)).thenReturn(Optional.of(memberB));
            when(userRepository.findActiveById(userBId)).thenReturn(Optional.of(userB));

            Chore chore = new Chore();
            chore.setId(UUID.randomUUID());
            chore.setHome(testHome);
            chore.setAssignee(userA); // asignada a Ana
            chore.setTitle("Limpiar microondas");
            chore.setBasePoints(20);
            chore.setDueDate(LocalDate.now().minusDays(2)); // vencida hace 2 días
            chore.setStatus(ChoreStatus.PENDING);

            when(choreRepository.findByIdAndHomeId(chore.getId(), homeId)).thenReturn(Optional.of(chore));
            when(choreRepository.save(any(Chore.class))).thenAnswer(inv -> inv.getArgument(0));

            ChoreResponseDto result = choreService.completeChore(homeId, chore.getId(), userBId); // Borja la rescata

            assertEquals(ChoreStatus.LATE_COMPLETED, result.status());
            assertEquals(userBId, result.completedById());

            ArgumentCaptor<ChoreRescuedEvent> eventCaptor = ArgumentCaptor.forClass(ChoreRescuedEvent.class);
            verify(eventPublisher).publishEvent(eventCaptor.capture());
            ChoreRescuedEvent rescuedEvent = eventCaptor.getValue();
            assertEquals(userBId, rescuedEvent.rescuerId());
            assertEquals(userAId, rescuedEvent.originalAssigneeId());
            assertEquals(20, rescuedEvent.pointsGained());
            assertEquals(20, rescuedEvent.pointsLost());
        }

        @Test
        @DisplayName("Rechazar completar una tarea que ya está completada previamente")
        void shouldRejectAlreadyCompletedChore() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));

            Chore chore = new Chore();
            chore.setId(UUID.randomUUID());
            chore.setHome(testHome);
            chore.setAssignee(userA);
            chore.setStatus(ChoreStatus.COMPLETED);

            when(choreRepository.findByIdAndHomeId(chore.getId(), homeId)).thenReturn(Optional.of(chore));

            assertThrows(BusinessRuleValidationException.class, () ->
                    choreService.completeChore(homeId, chore.getId(), userAId));
        }
    }

    @Nested
    @DisplayName("Eliminación de Tareas")
    class DeleteChoresTests {

        @Test
        @DisplayName("DELETE_SINGLE: Borra solo la fila específica")
        void deleteSingleChore() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));

            Chore chore = new Chore();
            chore.setId(UUID.randomUUID());
            chore.setHome(testHome);
            chore.setTitle("Descongelar nevera");
            chore.setSeriesId(UUID.randomUUID());

            when(choreRepository.findByIdAndHomeId(chore.getId(), homeId)).thenReturn(Optional.of(chore));

            choreService.deleteChore(homeId, chore.getId(), DeleteMode.DELETE_SINGLE, userAId);

            verify(choreRepository).delete(chore);
            verify(eventPublisher).publishEvent(any(ChoreDeletedEvent.class));
        }

        @Test
        @DisplayName("DELETE_FORWARD: Borra la tarea y todas las futuras pendientes de la misma serie")
        void deleteForwardChores() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));

            UUID seriesId = UUID.randomUUID();
            LocalDate today = LocalDate.now();

            Chore chore1 = new Chore();
            chore1.setId(UUID.randomUUID());
            chore1.setHome(testHome);
            chore1.setSeriesId(seriesId);
            chore1.setDueDate(today);
            chore1.setTitle("Regar plantas");
            chore1.setStatus(ChoreStatus.PENDING);

            Chore chore2 = new Chore();
            chore2.setId(UUID.randomUUID());
            chore2.setHome(testHome);
            chore2.setSeriesId(seriesId);
            chore2.setDueDate(today.plusDays(7));
            chore2.setTitle("Regar plantas");
            chore2.setStatus(ChoreStatus.PENDING);

            when(choreRepository.findByIdAndHomeId(chore1.getId(), homeId)).thenReturn(Optional.of(chore1));
            when(choreRepository.findByHomeIdAndSeriesIdAndDueDateGreaterThanEqualAndStatus(
                    homeId, seriesId, today, ChoreStatus.PENDING
            )).thenReturn(List.of(chore1, chore2));

            choreService.deleteChore(homeId, chore1.getId(), DeleteMode.DELETE_FORWARD, userAId);

            verify(choreRepository).deleteAll(List.of(chore1, chore2));
            ArgumentCaptor<ChoreDeletedEvent> eventCaptor = ArgumentCaptor.forClass(ChoreDeletedEvent.class);
            verify(eventPublisher).publishEvent(eventCaptor.capture());
            assertEquals(2, eventCaptor.getValue().deletedCount());
            assertEquals("DELETE_FORWARD", eventCaptor.getValue().deleteMode());
        }
    }

    @Nested
    @DisplayName("Leaderboard y Puntos Esperados")
    class LeaderboardTests {

        @Test
        @DisplayName("Calcula correctamente puntos actuales y esperados con rescates y tareas pendientes")
        void calculateLeaderboardAccurately() {
            when(homeMemberRepository.findByHomeIdAndUserId(homeId, userAId)).thenReturn(Optional.of(memberA));
            when(homeMemberRepository.findByHomeIdAndStatus(homeId, HomeMemberStatus.ACTIVE))
                    .thenReturn(List.of(memberA, memberB));

            LocalDate today = LocalDate.now();
            LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

            // Chore 1: Completed by Ana on-time (+10 to Ana)
            Chore c1 = new Chore();
            c1.setId(UUID.randomUUID());
            c1.setAssignee(userA);
            c1.setCompletedBy(userA);
            c1.setBasePoints(10);
            c1.setStatus(ChoreStatus.COMPLETED);
            c1.setDueDate(monday);

            // Chore 2: Rescued by Borja! Ana lost 15 pts, Borja won 15 pts
            Chore c2 = new Chore();
            c2.setId(UUID.randomUUID());
            c2.setAssignee(userA);
            c2.setCompletedBy(userB);
            c2.setBasePoints(15);
            c2.setStatus(ChoreStatus.LATE_COMPLETED);
            c2.setDueDate(monday);

            // Chore 3: Pending for Ana (+20 expected points)
            Chore c3 = new Chore();
            c3.setId(UUID.randomUUID());
            c3.setAssignee(userA);
            c3.setBasePoints(20);
            c3.setStatus(ChoreStatus.PENDING);
            c3.setDueDate(monday.plusDays(1));

            // Chore 4: Pending for Borja (+10 expected points)
            Chore c4 = new Chore();
            c4.setId(UUID.randomUUID());
            c4.setAssignee(userB);
            c4.setBasePoints(10);
            c4.setStatus(ChoreStatus.PENDING);
            c4.setDueDate(monday.plusDays(2));

            when(choreRepository.findForLeaderboard(eq(homeId), any(), any(), any(), any()))
                    .thenReturn(List.of(c1, c2, c3, c4));

            ChoreLeaderboardDto leaderboard = choreService.getLeaderboard(homeId, "WEEKLY", userAId);

            assertEquals(2, leaderboard.scores().size());

            // Borja: won 15 from rescue -> current = 15, expected = 15 + 10 (pending) = 25
            var borjaScore = leaderboard.scores().stream()
                    .filter(s -> s.userId().equals(userBId)).findFirst().orElseThrow();
            assertEquals(15, borjaScore.currentPoints());
            assertEquals(25, borjaScore.expectedPoints());
            assertEquals(1, borjaScore.rescuedCount());

            // Ana: won 10, lost 15 from rescue -> current = -5, expected = -5 + 20 (pending) = 15
            var anaScore = leaderboard.scores().stream()
                    .filter(s -> s.userId().equals(userAId)).findFirst().orElseThrow();
            assertEquals(-5, anaScore.currentPoints());
            assertEquals(15, anaScore.expectedPoints());
            assertEquals(1, anaScore.completedCount());
            assertEquals(1, anaScore.penalizedCount());
        }
    }
}
