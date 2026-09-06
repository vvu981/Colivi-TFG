package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
import com.vvu981.colivibackend.features.home.chore.dto.CreateChoreRequest;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreRepository;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreSeriesRepository;
import com.vvu981.colivibackend.features.home.chore.service.strategy.ChoreAssignmentContext;
import com.vvu981.colivibackend.features.home.chore.service.strategy.ChoreAssignmentStrategy;
import com.vvu981.colivibackend.features.home.chore.service.strategy.ChoreAssignmentStrategyResolver;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChoreRotationServiceImpl implements ChoreRotationService {

    private final ChoreSeriesRepository choreSeriesRepository;
    private final ChoreRepository choreRepository;
    private final UserRepository userRepository;
    private final ChoreAssignmentStrategyResolver strategyResolver;

    @Override
    @Transactional
    public ChoreSeries createSeries(Home home, CreateChoreRequest request, List<User> orderedParticipants) {
        if (orderedParticipants == null || orderedParticipants.isEmpty()) {
            throw new BusinessRuleValidationException("La serie debe contar con al menos un participante");
        }

        ChoreSeries series = new ChoreSeries();
        series.setHome(home);
        series.setTitle(request.title().trim());
        series.setDescription(request.description() != null ? request.description().trim() : null);
        series.setBasePoints(request.basePoints());
        series.setRecurrenceType(request.getSafeRecurrence());
        series.setOccurrences(request.getSafeOccurrences());
        series.setRotationType(request.getSafeRotationType());
        series.setLastAssigneeIndex(0);

        if (request.customDaysOfWeek() != null && !request.customDaysOfWeek().isEmpty()) {
            String daysStr = request.customDaysOfWeek().stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
            series.setCustomDaysOfWeek(daysStr);
        }

        List<UUID> participantIds = orderedParticipants.stream()
                .map(User::getId)
                .collect(Collectors.toCollection(ArrayList::new));
        series.setParticipantOrder(participantIds);

        if (series.getId() == null) {
            series.setId(UUID.randomUUID());
        }

        return choreSeriesRepository.save(series);
    }

    @Override
    @Transactional
    public List<Chore> generateOccurrences(ChoreSeries series, LocalDate baseDate, List<User> orderedParticipants) {
        if (orderedParticipants == null || orderedParticipants.isEmpty()) {
            throw new BusinessRuleValidationException("No hay participantes para generar las ocurrencias");
        }

        ChoreAssignmentStrategy strategy = strategyResolver.resolve(series.getRotationType());
        int occurrences = series.getOccurrences() != null && series.getOccurrences() > 0 ? series.getOccurrences() : 1;
        List<Chore> choresToSave = new ArrayList<>(occurrences);
        int startIndex = 0;

        if (series.getRecurrenceType() == RecurrenceType.CUSTOM) {
            Set<DayOfWeek> targetDays = parseCustomDays(series.getCustomDaysOfWeek());
            if (targetDays.isEmpty()) {
                throw new BusinessRuleValidationException("Debes seleccionar al menos un día de la semana para la repetición personalizada");
            }

            LocalDate candidate = baseDate;
            int generatedCount = 0;
            while (generatedCount < occurrences) {
                if (targetDays.contains(candidate.getDayOfWeek())) {
                    Chore chore = buildChore(series, candidate);
                    ChoreAssignmentContext ctx = new ChoreAssignmentContext(
                            series,
                            orderedParticipants,
                            startIndex,
                            generatedCount,
                            candidate
                    );
                    chore.setAssignee(strategy.determineAssignee(ctx));
                    choresToSave.add(chore);
                    generatedCount++;
                }
                candidate = candidate.plusDays(1);
            }
        } else {
            for (int i = 0; i < occurrences; i++) {
                LocalDate choreDueDate = switch (series.getRecurrenceType()) {
                    case NONE -> baseDate;
                    case DAILY -> baseDate.plusDays(i);
                    case WEEKLY -> baseDate.plusWeeks(i);
                    case MONTHLY -> baseDate.plusMonths(i);
                    case CUSTOM -> baseDate;
                };

                Chore chore = buildChore(series, choreDueDate);
                ChoreAssignmentContext ctx = new ChoreAssignmentContext(
                        series,
                        orderedParticipants,
                        startIndex,
                        i,
                        choreDueDate
                );
                chore.setAssignee(strategy.determineAssignee(ctx));
                choresToSave.add(chore);
            }
        }

        int lastIndex = Math.floorMod(startIndex + occurrences - 1, orderedParticipants.size());
        series.setLastAssigneeIndex(lastIndex);
        choreSeriesRepository.save(series);

        return choreRepository.saveAll(choresToSave);
    }

    @Override
    @Transactional
    public void handleUserLeftHome(UUID homeId, UUID userId) {
        log.info("Processing user departure for chores in homeId: {}, userId: {}", homeId, userId);

        // Bloqueo pesimista para evitar condiciones de carrera durante la salida y recalculación
        List<ChoreSeries> seriesList = choreSeriesRepository.findByHomeIdAndParticipantUserIdForUpdate(homeId, userId);

        LocalDate today = LocalDate.now();

        for (ChoreSeries series : seriesList) {
            boolean removed = series.removeParticipant(userId);
            if (!removed) {
                continue;
            }

            if (!series.hasParticipants()) {
                // REGLA DEL CERO ABSOLUTO: Ningún participante restante -> Eliminar masivamente tareas pendientes futuras
                List<Chore> futurePending = choreRepository.findPendingFutureChoresBySeriesId(series.getId(), today);
                if (!futurePending.isEmpty()) {
                    log.warn("Series {} has 0 participants left after user {} left. Invoking bulk deletion (DELETE_FORWARD) for {} pending chores.",
                            series.getId(), userId, futurePending.size());
                    choreRepository.deleteAll(futurePending);
                }
                series.setLastAssigneeIndex(0);
                choreSeriesRepository.save(series);
            } else {
                // Participantes restantes -> Recalcular en bloque manteniendo el Round-Robin
                reassignPendingChores(series);
            }
        }
    }

    @Override
    @Transactional
    public void reassignPendingChores(ChoreSeries series) {
        LocalDate today = LocalDate.now();
        List<Chore> pendingChores = choreRepository.findPendingFutureChoresBySeriesId(series.getId(), today);

        if (pendingChores.isEmpty()) {
            return;
        }

        List<UUID> participantIds = series.getParticipantOrder();
        if (participantIds.isEmpty()) {
            // Regla del cero absoluto por seguridad
            choreRepository.deleteAll(pendingChores);
            series.setLastAssigneeIndex(0);
            choreSeriesRepository.save(series);
            return;
        }

        Map<UUID, User> userMap = userRepository.findAllById(participantIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<User> orderedParticipants = participantIds.stream()
                .map(userMap::get)
                .filter(Objects::nonNull)
                .toList();

        if (orderedParticipants.isEmpty()) {
            choreRepository.deleteAll(pendingChores);
            series.setLastAssigneeIndex(0);
            choreSeriesRepository.save(series);
            return;
        }

        ChoreAssignmentStrategy strategy = strategyResolver.resolve(series.getRotationType());
        int startIndex = 0;

        for (int i = 0; i < pendingChores.size(); i++) {
            Chore chore = pendingChores.get(i);
            ChoreAssignmentContext ctx = new ChoreAssignmentContext(
                    series,
                    orderedParticipants,
                    startIndex,
                    i,
                    chore.getDueDate()
            );
            chore.setAssignee(strategy.determineAssignee(ctx));
        }

        int finalLastIndex = Math.floorMod(startIndex + pendingChores.size() - 1, orderedParticipants.size());
        series.setLastAssigneeIndex(finalLastIndex);

        choreSeriesRepository.save(series);
        choreRepository.saveAll(pendingChores);

        log.info("Reassigned {} pending chores for series {} across {} participants. Final lastAssigneeIndex: {}",
                pendingChores.size(), series.getId(), orderedParticipants.size(), finalLastIndex);
    }

    private Chore buildChore(ChoreSeries series, LocalDate dueDate) {
        Chore chore = new Chore();
        chore.setId(UUID.randomUUID());
        chore.setHome(series.getHome());
        chore.setSeries(series);
        chore.setTitle(series.getTitle());
        chore.setDescription(series.getDescription());
        chore.setBasePoints(series.getBasePoints());
        chore.setDueDate(dueDate);
        chore.setStatus(ChoreStatus.PENDING);
        return chore;
    }

    private Set<DayOfWeek> parseCustomDays(String customDaysOfWeek) {
        if (customDaysOfWeek == null || customDaysOfWeek.isBlank()) {
            return Collections.emptySet();
        }
        Set<DayOfWeek> targetDays = new HashSet<>();
        for (String dayStr : customDaysOfWeek.split(",")) {
            try {
                int dayNum = Integer.parseInt(dayStr.trim());
                if (dayNum >= 1 && dayNum <= 7) {
                    targetDays.add(DayOfWeek.of(dayNum));
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return targetDays;
    }
}
