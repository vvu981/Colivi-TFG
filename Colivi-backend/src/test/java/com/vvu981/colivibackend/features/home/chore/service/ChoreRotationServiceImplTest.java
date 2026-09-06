package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import com.vvu981.colivibackend.features.home.chore.dto.CreateChoreRequest;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreRepository;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreSeriesRepository;
import com.vvu981.colivibackend.features.home.chore.service.strategy.ChoreAssignmentStrategyResolver;
import com.vvu981.colivibackend.features.home.chore.service.strategy.FixedAssigneeStrategy;
import com.vvu981.colivibackend.features.home.chore.service.strategy.RoundRobinRotationStrategy;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChoreRotationServiceImplTest {

        @Mock
        private ChoreSeriesRepository choreSeriesRepository;

        @Mock
        private ChoreRepository choreRepository;

        @Mock
        private UserRepository userRepository;

        private ChoreRotationServiceImpl rotationService;

        private Home home;
        private User userA;
        private User userB;
        private User userC;

        @BeforeEach
        void setUp() {
                ChoreAssignmentStrategyResolver resolver = new ChoreAssignmentStrategyResolver(
                                List.of(new FixedAssigneeStrategy(), new RoundRobinRotationStrategy()));

                rotationService = new ChoreRotationServiceImpl(
                                choreSeriesRepository,
                                choreRepository,
                                userRepository,
                                resolver);

                home = new Home();
                home.setId(UUID.randomUUID());
                home.setName("Coliving Centro");

                userA = new User();
                userA.setId(UUID.randomUUID());
                userA.setFirstName("Ana");

                userB = new User();
                userB.setId(UUID.randomUUID());
                userB.setFirstName("Borja");

                userC = new User();
                userC.setId(UUID.randomUUID());
                userC.setFirstName("Carlos");
        }

        @Test
        @DisplayName("Debe crear una ChoreSeries y materializar ocurrencias rotativas Round-Robin")
        void shouldCreateSeriesAndMaterializeRoundRobinChores() {
                when(choreSeriesRepository.save(any(ChoreSeries.class))).thenAnswer(i -> i.getArgument(0));
                when(choreRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

                LocalDate startDate = LocalDate.of(2026, 9, 7);
                CreateChoreRequest request = new CreateChoreRequest(
                                "Fregar platos",
                                "Limpiar fregadero",
                                userA.getId(),
                                10,
                                startDate,
                                RecurrenceType.DAILY,
                                5,
                                null,
                                List.of(userA.getId(), userB.getId(), userC.getId()),
                                RotationType.ROUND_ROBIN);

                List<User> participants = List.of(userA, userB, userC);
                ChoreSeries series = rotationService.createSeries(home, request, participants);

                assertNotNull(series);
                assertEquals(3, series.getParticipantOrder().size());
                assertEquals(RotationType.ROUND_ROBIN, series.getRotationType());

                List<Chore> chores = rotationService.generateOccurrences(series, startDate, participants);

                assertEquals(5, chores.size());
                assertEquals(userA, chores.get(0).getAssignee());
                assertEquals(userB, chores.get(1).getAssignee());
                assertEquals(userC, chores.get(2).getAssignee());
                assertEquals(userA, chores.get(3).getAssignee());
                assertEquals(userB, chores.get(4).getAssignee());

                // Verificamos actualizacion del indice en serie: (0 + 5 - 1) % 3 = 1 (userB)
                assertEquals(1, series.getLastAssigneeIndex());
                verify(choreSeriesRepository, atLeastOnce()).save(series);
        }

        @Test
        @DisplayName("Regla del Cero Absoluto: Al salir el único participante, elimina masivamente las tareas futuras PENDING")
        void shouldInvokeBulkDeletionWhenZeroParticipantsRemaining() {
                ChoreSeries series = new ChoreSeries();
                series.setId(UUID.randomUUID());
                series.setHome(home);
                series.setParticipantOrder(new ArrayList<>(List.of(userA.getId())));
                series.setRotationType(RotationType.ROUND_ROBIN);

                when(choreSeriesRepository.findByHomeIdAndParticipantUserIdForUpdate(home.getId(), userA.getId()))
                                .thenReturn(List.of(series));

                Chore pending1 = new Chore();
                pending1.setId(UUID.randomUUID());
                pending1.setStatus(ChoreStatus.PENDING);
                pending1.setDueDate(LocalDate.now().plusDays(1));

                Chore pending2 = new Chore();
                pending2.setId(UUID.randomUUID());
                pending2.setStatus(ChoreStatus.PENDING);
                pending2.setDueDate(LocalDate.now().plusDays(2));

                when(choreRepository.findPendingFutureChoresBySeriesId(eq(series.getId()), any(LocalDate.class)))
                                .thenReturn(List.of(pending1, pending2));

                rotationService.handleUserLeftHome(home.getId(), userA.getId());

                assertTrue(series.getParticipantOrder().isEmpty());
                assertEquals(0, series.getLastAssigneeIndex());

                // Debe eliminar masivamente las tareas huérfanas
                verify(choreRepository).deleteAll(List.of(pending1, pending2));
                verify(choreSeriesRepository).save(series);
        }

        @Test
        @DisplayName("Recálculo en Bloque: Al salir un participante de tres, reasigna tareas futuras entre los dos restantes con Round-Robin")
        void shouldReassignPendingChoresWhenOneOfThreeParticipantsLeaves() {
                ChoreSeries series = new ChoreSeries();
                series.setId(UUID.randomUUID());
                series.setHome(home);
                series.setParticipantOrder(new ArrayList<>(List.of(userA.getId(), userB.getId(), userC.getId())));
                series.setRotationType(RotationType.ROUND_ROBIN);
                series.setLastAssigneeIndex(0);

                when(choreSeriesRepository.findByHomeIdAndParticipantUserIdForUpdate(home.getId(), userB.getId()))
                                .thenReturn(List.of(series));

                Chore chore1 = new Chore();
                chore1.setId(UUID.randomUUID());
                chore1.setDueDate(LocalDate.now().plusDays(1));
                chore1.setStatus(ChoreStatus.PENDING);
                chore1.setAssignee(userB);

                Chore chore2 = new Chore();
                chore2.setId(UUID.randomUUID());
                chore2.setDueDate(LocalDate.now().plusDays(2));
                chore2.setStatus(ChoreStatus.PENDING);
                chore2.setAssignee(userC);

                Chore chore3 = new Chore();
                chore3.setId(UUID.randomUUID());
                chore3.setDueDate(LocalDate.now().plusDays(3));
                chore3.setStatus(ChoreStatus.PENDING);
                chore3.setAssignee(userA);

                when(choreRepository.findPendingFutureChoresBySeriesId(eq(series.getId()), any(LocalDate.class)))
                                .thenReturn(List.of(chore1, chore2, chore3));

                when(userRepository.findAllById(List.of(userA.getId(), userC.getId())))
                                .thenReturn(List.of(userA, userC));

                rotationService.handleUserLeftHome(home.getId(), userB.getId());

                // Remaining participants: userA and userC
                assertEquals(List.of(userA.getId(), userC.getId()), series.getParticipantOrder());

                // Reassigned: chore1 -> userA, chore2 -> userC, chore3 -> userA
                assertEquals(userA, chore1.getAssignee());
                assertEquals(userC, chore2.getAssignee());
                assertEquals(userA, chore3.getAssignee());

                // Final lastAssigneeIndex: (0 + 3 - 1) % 2 = 0 (userA)
                assertEquals(0, series.getLastAssigneeIndex());

                verify(choreRepository).saveAll(List.of(chore1, chore2, chore3));
                verify(choreSeriesRepository).save(series);
        }

        @Test
        @DisplayName("Generación de ocurrencias con RecurrenceType.CUSTOM y días específicos")
        void shouldGenerateOccurrencesWithCustomRecurrence() {
                ChoreSeries series = new ChoreSeries();
                series.setId(UUID.randomUUID());
                series.setHome(home);
                series.setTitle("Custom Task");
                series.setRecurrenceType(RecurrenceType.CUSTOM);
                series.setCustomDaysOfWeek("1,3,5"); // Mon, Wed, Fri
                series.setOccurrences(3);
                series.setRotationType(RotationType.ROUND_ROBIN);
                series.setParticipantOrder(new ArrayList<>(List.of(userA.getId(), userB.getId())));

                when(choreRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

                // 2026-09-07 is Monday (1)
                LocalDate baseDate = LocalDate.of(2026, 9, 7);
                List<Chore> generated = rotationService.generateOccurrences(series, baseDate, List.of(userA, userB));

                assertEquals(3, generated.size());
                assertEquals(LocalDate.of(2026, 9, 7), generated.get(0).getDueDate());  // Mon
                assertEquals(LocalDate.of(2026, 9, 9), generated.get(1).getDueDate());  // Wed
                assertEquals(LocalDate.of(2026, 9, 11), generated.get(2).getDueDate()); // Fri
        }

        @Test
        @DisplayName("Generación de ocurrencias con RecurrenceType.CUSTOM sin días válidos lanza excepción")
        void shouldThrowExceptionWhenCustomRecurrenceHasNoValidDays() {
                ChoreSeries series = new ChoreSeries();
                series.setRecurrenceType(RecurrenceType.CUSTOM);
                series.setCustomDaysOfWeek("invalid,data");
                series.setOccurrences(3);

                assertThrows(com.vvu981.colivibackend.core.exception.BusinessRuleValidationException.class, () ->
                        rotationService.generateOccurrences(series, LocalDate.now(), List.of(userA)));
        }

        @Test
        @DisplayName("Generación con DAILY, MONTHLY y NONE cubre todas las ramas de repetición")
        void shouldGenerateOccurrencesForDailyMonthlyAndNone() {
                when(choreRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
                LocalDate baseDate = LocalDate.of(2026, 9, 1);

                // DAILY
                ChoreSeries dailySeries = new ChoreSeries();
                dailySeries.setRecurrenceType(RecurrenceType.DAILY);
                dailySeries.setOccurrences(2);
                dailySeries.setRotationType(RotationType.FIXED);
                List<Chore> dailyChores = rotationService.generateOccurrences(dailySeries, baseDate, List.of(userA));
                assertEquals(2, dailyChores.size());
                assertEquals(baseDate, dailyChores.get(0).getDueDate());
                assertEquals(baseDate.plusDays(1), dailyChores.get(1).getDueDate());

                // MONTHLY
                ChoreSeries monthlySeries = new ChoreSeries();
                monthlySeries.setRecurrenceType(RecurrenceType.MONTHLY);
                monthlySeries.setOccurrences(2);
                monthlySeries.setRotationType(RotationType.FIXED);
                List<Chore> monthlyChores = rotationService.generateOccurrences(monthlySeries, baseDate, List.of(userA));
                assertEquals(2, monthlyChores.size());
                assertEquals(baseDate, monthlyChores.get(0).getDueDate());
                assertEquals(baseDate.plusMonths(1), monthlyChores.get(1).getDueDate());

                // NONE
                ChoreSeries noneSeries = new ChoreSeries();
                noneSeries.setRecurrenceType(RecurrenceType.NONE);
                noneSeries.setOccurrences(1);
                noneSeries.setRotationType(RotationType.FIXED);
                List<Chore> noneChores = rotationService.generateOccurrences(noneSeries, baseDate, List.of(userA));
                assertEquals(1, noneChores.size());
                assertEquals(baseDate, noneChores.get(0).getDueDate());
        }

        @Test
        @DisplayName("handleUserLeftHome no altera la serie si el usuario no estaba en la lista de participantes")
        void shouldIgnoreWhenUserNotParticipant() {
                ChoreSeries series = new ChoreSeries();
                series.setId(UUID.randomUUID());
                series.setParticipantOrder(new ArrayList<>(List.of(userA.getId())));

                when(choreSeriesRepository.findByHomeIdAndParticipantUserIdForUpdate(home.getId(), userB.getId()))
                        .thenReturn(List.of(series));

                rotationService.handleUserLeftHome(home.getId(), userB.getId());

                verify(choreRepository, never()).deleteAll(any());
                verify(choreRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("handleUserLeftHome cuando quedan 0 participantes pero no hay tareas pendientes futuras")
        void shouldHandleZeroParticipantsWhenNoFuturePendingChores() {
                ChoreSeries series = new ChoreSeries();
                series.setId(UUID.randomUUID());
                series.setParticipantOrder(new ArrayList<>(List.of(userA.getId())));

                when(choreSeriesRepository.findByHomeIdAndParticipantUserIdForUpdate(home.getId(), userA.getId()))
                        .thenReturn(List.of(series));
                when(choreRepository.findPendingFutureChoresBySeriesId(eq(series.getId()), any(LocalDate.class)))
                        .thenReturn(List.of());

                rotationService.handleUserLeftHome(home.getId(), userA.getId());

                verify(choreRepository, never()).deleteAll(any());
                verify(choreSeriesRepository).save(series);
        }

        @Test
        @DisplayName("createSeries y generateOccurrences validan lista de participantes vacía")
        void shouldValidateEmptyParticipants() {
                CreateChoreRequest request = new CreateChoreRequest(
                        "Task", null, userA.getId(), 10, LocalDate.now(), RecurrenceType.NONE, 1
                );

                assertThrows(com.vvu981.colivibackend.core.exception.BusinessRuleValidationException.class, () ->
                        rotationService.createSeries(home, request, List.of()));

                assertThrows(com.vvu981.colivibackend.core.exception.BusinessRuleValidationException.class, () ->
                        rotationService.generateOccurrences(new ChoreSeries(), LocalDate.now(), List.of()));
        }
}
