package com.vvu981.colivibackend.features.home.chore.mapper;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreResponseDto;
import com.vvu981.colivibackend.features.user.domain.User;
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

        String assigneeName = resolveUserDisplayName(chore.getAssignee());

        String completedByName = null;
        String completedByAvatar = null;
        if (chore.getCompletedBy() != null) {
            completedByName = resolveUserDisplayName(chore.getCompletedBy());
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

    private String resolveUserDisplayName(User user) {
        if (user == null) {
            return "Desconocido";
        }
        String fullName = user.getFullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }
        String nickname = user.getNickname();
        return (nickname != null && !nickname.isBlank()) ? nickname.trim() : "Desconocido";
    }
}
