package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreCompletedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreDeletedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreRescuedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreSeriesCreatedEvent;
import com.vvu981.colivibackend.features.home.chore.dto.*;
import com.vvu981.colivibackend.features.home.chore.mapper.ChoreMapper;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreRepository;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.home.domain.HomeMemberStatus;
import com.vvu981.colivibackend.features.home.repository.HomeMemberRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.vvu981.colivibackend.features.home.chore.repository.ChoreSpecifications;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChoreServiceImpl implements ChoreService {

    private final ChoreRepository choreRepository;
    private final HomeRepository homeRepository;
    private final HomeMemberRepository homeMemberRepository;
    private final UserRepository userRepository;
    private final ChoreMapper choreMapper;
    private final ChorePointCalculator chorePointCalculator;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public List<ChoreResponseDto> createChore(UUID homeId, CreateChoreRequest request, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        Home home = homeRepository.findByIdAndDeletedAtIsNull(homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Hogar no encontrado"));

        validateActiveMember(homeId, request.assigneeId());

        User assignee = userRepository.findActiveById(request.assigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario asignado no encontrado"));

        RecurrenceType recurrence = request.getSafeRecurrence();
        int occurrences = recurrence == RecurrenceType.NONE ? 1 : request.getSafeOccurrences();
        UUID seriesId = UUID.randomUUID();

        List<Chore> choresToSave = new ArrayList<>();
        LocalDate baseDate = request.dueDate();

        if (recurrence == RecurrenceType.CUSTOM) {
            List<Integer> customDays = request.getSafeCustomDaysOfWeek();
            if (customDays.isEmpty()) {
                throw new BusinessRuleValidationException("Debes seleccionar al menos un día de la semana para la repetición personalizada");
            }
            Set<DayOfWeek> targetDays = new HashSet<>();
            for (Integer dayNum : customDays) {
                if (dayNum == null || dayNum < 1 || dayNum > 7) {
                    throw new BusinessRuleValidationException("Los días de la semana deben estar entre 1 (Lunes) y 7 (Domingo)");
                }
                targetDays.add(DayOfWeek.of(dayNum));
            }

            LocalDate candidate = baseDate;
            while (choresToSave.size() < occurrences) {
                if (targetDays.contains(candidate.getDayOfWeek())) {
                    Chore chore = new Chore();
                    chore.setHome(home);
                    chore.setAssignee(assignee);
                    chore.setSeriesId(seriesId);
                    chore.setTitle(request.title().trim());
                    chore.setDescription(request.description() != null ? request.description().trim() : null);
                    chore.setBasePoints(request.basePoints());
                    chore.setDueDate(candidate);
                    chore.setStatus(ChoreStatus.PENDING);
                    choresToSave.add(chore);
                }
                candidate = candidate.plusDays(1);
            }
        } else {
            for (int i = 0; i < occurrences; i++) {
                LocalDate choreDueDate = switch (recurrence) {
                    case NONE -> baseDate;
                    case DAILY -> baseDate.plusDays(i);
                    case WEEKLY -> baseDate.plusWeeks(i);
                    case MONTHLY -> baseDate.plusMonths(i);
                    case CUSTOM -> baseDate;
                };

                Chore chore = new Chore();
                chore.setHome(home);
                chore.setAssignee(assignee);
                chore.setSeriesId(seriesId);
                chore.setTitle(request.title().trim());
                chore.setDescription(request.description() != null ? request.description().trim() : null);
                chore.setBasePoints(request.basePoints());
                chore.setDueDate(choreDueDate);
                chore.setStatus(ChoreStatus.PENDING);

                choresToSave.add(chore);
            }
        }

        List<Chore> saved = choreRepository.saveAll(choresToSave);

        eventPublisher.publishEvent(new ChoreSeriesCreatedEvent(
                homeId,
                requestUserId,
                request.title().trim(),
                occurrences,
                request.basePoints()
        ));

        Map<UUID, String> memberColors = getActiveMemberColors(homeId);
        LocalDate today = LocalDate.now();
        return saved.stream()
                .map(chore -> choreMapper.toDto(
                        chore,
                        requestUserId,
                        today,
                        chore.getAssignee() != null ? memberColors.get(chore.getAssignee().getId()) : null
                ))
                .toList();
    }

    @Override
    public List<ChoreResponseDto> getChores(UUID homeId, ChoreFilterDto filter, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        LocalDate today = LocalDate.now();
        LocalDate from = filter != null ? filter.from() : null;
        LocalDate to = filter != null ? filter.to() : null;
        String period = filter != null ? filter.period() : null;

        if (period != null) {
            ChorePointCalculator.PeriodRange range = chorePointCalculator.resolvePeriodRange(period, today);
            if ("TODAY".equalsIgnoreCase(period)) {
                from = today;
                to = today;
            } else if ("WEEK".equalsIgnoreCase(period) || "WEEKLY".equalsIgnoreCase(period)) {
                from = range.startDate();
                to = range.endDate();
            } else if ("MONTH".equalsIgnoreCase(period) || "MONTHLY".equalsIgnoreCase(period)) {
                from = range.startDate();
                to = range.endDate();
            }
        }

        UUID assigneeId = filter != null ? filter.assigneeId() : null;
        ChoreStatus status = filter != null ? filter.status() : null;

        Specification<Chore> spec = Specification.where(ChoreSpecifications.withHomeId(homeId))
                .and(ChoreSpecifications.fetchAssociations());

        if (assigneeId != null) {
            spec = spec.and(ChoreSpecifications.withAssigneeId(assigneeId));
        }
        if (status != null) {
            spec = spec.and(ChoreSpecifications.withStatus(status));
        }
        if (from != null) {
            spec = spec.and(ChoreSpecifications.withDueDateFrom(from));
        }
        if (to != null) {
            spec = spec.and(ChoreSpecifications.withDueDateTo(to));
        }

        Sort sort = Sort.by(Sort.Direction.ASC, "dueDate").and(Sort.by(Sort.Direction.ASC, "createdAt"));
        List<Chore> chores = choreRepository.findAll(spec, sort);

        if ("LATE".equalsIgnoreCase(period)) {
            chores = chores.stream()
                    .filter(c -> c.isLate(today) && c.isPending())
                    .toList();
        }

        Map<UUID, String> memberColors = getActiveMemberColors(homeId);
        return chores.stream()
                .map(chore -> choreMapper.toDto(
                        chore,
                        requestUserId,
                        today,
                        chore.getAssignee() != null ? memberColors.get(chore.getAssignee().getId()) : null
                ))
                .toList();
    }

    @Override
    @Transactional
    public ChoreResponseDto completeChore(UUID homeId, UUID choreId, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        Chore chore = choreRepository.findByIdAndHomeId(choreId, homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea no encontrada"));

        if (chore.isCompleted()) {
            throw new BusinessRuleValidationException("La tarea ya ha sido completada previamente");
        }

        User currentUser = userRepository.findActiveById(requestUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario actual no encontrado"));

        LocalDate today = LocalDate.now();
        boolean isLate = chore.isLate(today);
        boolean isAssignee = chore.getAssignee().getId().equals(requestUserId);

        if (!isLate && !isAssignee) {
            throw new BusinessRuleValidationException(
                    "Solo el usuario asignado puede completar la tarea antes de su vencimiento. Para rescatarla, debe estar atrasada."
            );
        }

        chore.setCompletedBy(currentUser);
        chore.setCompletedAt(LocalDateTime.now());

        if (isLate && !isAssignee) {
            // Gamification: Rescue mechanics
            chore.setStatus(ChoreStatus.LATE_COMPLETED);
            choreRepository.save(chore);

            String rescuerName = getUserDisplayName(currentUser);
            String assigneeName = getUserDisplayName(chore.getAssignee());

            eventPublisher.publishEvent(new ChoreRescuedEvent(
                    homeId,
                    requestUserId,
                    rescuerName,
                    chore.getAssignee().getId(),
                    assigneeName,
                    choreId,
                    chore.getTitle(),
                    chore.getBasePoints(),
                    chore.getBasePoints()
            ));
        } else {
            // Assignee completed either on-time or late before rescue
            chore.setStatus(ChoreStatus.COMPLETED);
            choreRepository.save(chore);

            eventPublisher.publishEvent(new ChoreCompletedEvent(
                    homeId,
                    requestUserId,
                    choreId,
                    chore.getTitle(),
                    chore.getBasePoints()
            ));
        }

        Map<UUID, String> memberColors = getActiveMemberColors(homeId);
        return choreMapper.toDto(
                chore,
                requestUserId,
                today,
                chore.getAssignee() != null ? memberColors.get(chore.getAssignee().getId()) : null
        );
    }

    @Override
    @Transactional
    public void deleteChore(UUID homeId, UUID choreId, DeleteMode deleteMode, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        Chore chore = choreRepository.findByIdAndHomeId(choreId, homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea no encontrada"));

        DeleteMode mode = deleteMode != null ? deleteMode : DeleteMode.DELETE_SINGLE;

        if (mode == DeleteMode.DELETE_SINGLE || chore.getSeriesId() == null) {
            choreRepository.delete(chore);
            eventPublisher.publishEvent(new ChoreDeletedEvent(
                    homeId,
                    requestUserId,
                    chore.getTitle(),
                    "DELETE_SINGLE",
                    1
            ));
        } else {
            // DELETE_FORWARD: delete this and all following pending chores of this series
            List<Chore> futurePending = choreRepository.findByHomeIdAndSeriesIdAndDueDateGreaterThanEqualAndStatus(
                    homeId,
                    chore.getSeriesId(),
                    chore.getDueDate(),
                    ChoreStatus.PENDING
            );

            choreRepository.deleteAll(futurePending);
            eventPublisher.publishEvent(new ChoreDeletedEvent(
                    homeId,
                    requestUserId,
                    chore.getTitle(),
                    "DELETE_FORWARD",
                    futurePending.size()
            ));
        }
    }

    @Override
    public ChoreLeaderboardDto getLeaderboard(UUID homeId, String period, UUID requestUserId) {
        validateActiveMember(homeId, requestUserId);

        LocalDate today = LocalDate.now();
        ChorePointCalculator.PeriodRange range = chorePointCalculator.resolvePeriodRange(period, today);

        List<HomeMember> members = homeMemberRepository.findByHomeIdAndStatus(homeId, HomeMemberStatus.ACTIVE);

        LocalDateTime startDateTime = range.startDate().atStartOfDay();
        LocalDateTime endDateTime = range.endDate().atTime(23, 59, 59);

        List<Chore> chores = choreRepository.findForLeaderboard(
                homeId,
                startDateTime,
                endDateTime,
                range.startDate(),
                range.endDate()
        );

        return chorePointCalculator.calculateLeaderboard(period, range, members, chores);
    }

    private void validateActiveMember(UUID homeId, UUID userId) {
        HomeMember member = homeMemberRepository.findByHomeIdAndUserId(homeId, userId)
                .orElseThrow(() -> new UnauthorizedActionException("No perteneces a este hogar"));

        if (member.getStatus() != HomeMemberStatus.ACTIVE) {
            throw new UnauthorizedActionException("Tu membresía en este hogar no está activa");
        }
    }

    private String getUserDisplayName(User user) {
        if (user == null) {
            return "Desconocido";
        }
        String fullName = (user.getFirstName() + " " +
                (user.getLastName1() != null ? user.getLastName1() : "")).trim();
        return fullName.isBlank() ? user.getNickname() : fullName;
    }

    private Map<UUID, String> getActiveMemberColors(UUID homeId) {
        return homeMemberRepository.findByHomeIdAndStatus(homeId, HomeMemberStatus.ACTIVE)
                .stream()
                .filter(m -> m.getUser() != null && m.getUser().getId() != null)
                .collect(Collectors.toMap(
                        m -> m.getUser().getId(),
                        m -> m.getColor() != null ? m.getColor() : "#4F46E5",
                        (c1, c2) -> c1
                ));
    }
}
