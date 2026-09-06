package com.vvu981.colivibackend.features.home.chore.service.strategy;

import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import com.vvu981.colivibackend.features.user.domain.User;

public interface ChoreAssignmentStrategy {

    RotationType getSupportedType();

    User determineAssignee(ChoreAssignmentContext context);
}
