package com.vvu981.colivibackend.features.home.chore.service.strategy;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RoundRobinRotationStrategy implements ChoreAssignmentStrategy {

    @Override
    public RotationType getSupportedType() {
        return RotationType.ROUND_ROBIN;
    }

    @Override
    public User determineAssignee(ChoreAssignmentContext context) {
        List<User> participants = context.orderedParticipants();
        if (participants == null || participants.isEmpty()) {
            throw new BusinessRuleValidationException("No hay participantes configurados para la rotación");
        }

        int targetIndex = Math.floorMod(context.startIndex() + context.occurrenceIndex(), participants.size());
        return participants.get(targetIndex);
    }
}
