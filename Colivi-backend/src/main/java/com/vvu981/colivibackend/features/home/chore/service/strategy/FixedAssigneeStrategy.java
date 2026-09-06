package com.vvu981.colivibackend.features.home.chore.service.strategy;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class FixedAssigneeStrategy implements ChoreAssignmentStrategy {

    @Override
    public RotationType getSupportedType() {
        return RotationType.FIXED;
    }

    @Override
    public User determineAssignee(ChoreAssignmentContext context) {
        if (context.orderedParticipants() == null || context.orderedParticipants().isEmpty()) {
            throw new BusinessRuleValidationException("No hay un usuario asignado para la tarea");
        }
        return context.orderedParticipants().get(0);
    }
}
