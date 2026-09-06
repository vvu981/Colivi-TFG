package com.vvu981.colivibackend.features.home.chore.service.strategy;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class ChoreAssignmentStrategyResolver {

    private final Map<RotationType, ChoreAssignmentStrategy> strategies = new EnumMap<>(RotationType.class);

    public ChoreAssignmentStrategyResolver(List<ChoreAssignmentStrategy> strategyList) {
        for (ChoreAssignmentStrategy strategy : strategyList) {
            strategies.put(strategy.getSupportedType(), strategy);
        }
    }

    public ChoreAssignmentStrategy resolve(RotationType rotationType) {
        RotationType type = rotationType != null ? rotationType : RotationType.FIXED;
        ChoreAssignmentStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new BusinessRuleValidationException("Estrategia de asignación no soportada: " + type);
        }
        return strategy;
    }
}
