package com.vvu981.colivibackend.features.home.chore.mapper;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreResponseDto;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

@Component
public class ChoreMapper {

    public ChoreResponseDto toDto(Chore chore, UUID currentUserId, LocalDate referenceDate) {
        return toDto(chore, currentUserId, referenceDate, null);
    }

    public ChoreResponseDto toDto(Chore chore, UUID currentUserId, LocalDate referenceDate, String assigneeColor) {
        if (chore == null) {
            return null;
        }

        LocalDate today = referenceDate != null ? referenceDate : LocalDate.now();
        boolean isLate = chore.isLate(today) && chore.isPending();
        boolean isAssignee = currentUserId != null && chore.getAssignee() != null &&
                currentUserId.equals(chore.getAssignee().getId());

        boolean canRescue = isLate && !isAssignee;
        boolean canComplete = chore.isPending() && (isAssignee || isLate);

        String assigneeName = chore.getAssignee() != null ?
                (chore.getAssignee().getFirstName() + " " +
                        (chore.getAssignee().getLastName1() != null ? chore.getAssignee().getLastName1() : "")).trim() :
                "Desconocido";
        if (assigneeName.isBlank() && chore.getAssignee() != null) {
            assigneeName = chore.getAssignee().getNickname();
        }

        String completedByName = null;
        String completedByAvatar = null;
        if (chore.getCompletedBy() != null) {
            completedByName = (chore.getCompletedBy().getFirstName() + " " +
                    (chore.getCompletedBy().getLastName1() != null ? chore.getCompletedBy().getLastName1() : "")).trim();
            if (completedByName.isBlank()) {
                completedByName = chore.getCompletedBy().getNickname();
            }
            completedByAvatar = chore.getCompletedBy().getProfilePicUrl();
        }

        return new ChoreResponseDto(
                chore.getId(),
                chore.getSeriesId(),
                chore.getHome() != null ? chore.getHome().getId() : null,
                chore.getTitle(),
                chore.getDescription(),
                chore.getAssignee() != null ? chore.getAssignee().getId() : null,
                assigneeName,
                chore.getAssignee() != null ? chore.getAssignee().getProfilePicUrl() : null,
                assigneeColor != null ? assigneeColor : "#4F46E5",
                chore.getCompletedBy() != null ? chore.getCompletedBy().getId() : null,
                completedByName,
                completedByAvatar,
                chore.getBasePoints(),
                chore.getDueDate(),
                chore.getStatus(),
                chore.getCompletedAt(),
                chore.getCreatedAt(),
                isLate,
                canRescue,
                canComplete
        );
    }
}
