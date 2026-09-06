package com.vvu981.colivibackend.features.home.chore.service.strategy;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChoreStrategyTest {

    private FixedAssigneeStrategy fixedStrategy;
    private RoundRobinRotationStrategy roundRobinStrategy;
    private ChoreAssignmentStrategyResolver resolver;

    private User userA;
    private User userB;
    private User userC;

    @BeforeEach
    void setUp() {
        fixedStrategy = new FixedAssigneeStrategy();
        roundRobinStrategy = new RoundRobinRotationStrategy();
        resolver = new ChoreAssignmentStrategyResolver(List.of(fixedStrategy, roundRobinStrategy));

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
    @DisplayName("Resolver debe resolver correctamente cada estrategia por RotationType")
    void resolverShouldResolveStrategiesCorrectly() {
        assertEquals(fixedStrategy, resolver.resolve(RotationType.FIXED));
        assertEquals(roundRobinStrategy, resolver.resolve(RotationType.ROUND_ROBIN));
        // Default null should resolve to FIXED
        assertEquals(fixedStrategy, resolver.resolve(null));
    }

    @Test
    @DisplayName("FixedAssigneeStrategy debe retornar siempre el primer participante")
    void fixedAssigneeStrategyShouldAlwaysReturnFirstParticipant() {
        ChoreAssignmentContext ctx = new ChoreAssignmentContext(
                new ChoreSeries(),
                List.of(userA, userB),
                0,
                3,
                LocalDate.now());

        User assignee = fixedStrategy.determineAssignee(ctx);
        assertEquals(userA, assignee);
    }

    @Test
    @DisplayName("FixedAssigneeStrategy debe lanzar excepcion si lista esta vacia")
    void fixedAssigneeStrategyShouldThrowWhenEmpty() {
        ChoreAssignmentContext ctx = new ChoreAssignmentContext(
                new ChoreSeries(),
                Collections.emptyList(),
                0,
                0,
                LocalDate.now());

        assertThrows(BusinessRuleValidationException.class, () -> fixedStrategy.determineAssignee(ctx));
    }

    @Test
    @DisplayName("RoundRobinRotationStrategy debe alternar estrictamente A -> B -> C -> A")
    void roundRobinStrategyShouldAlternateDeterministically() {
        List<User> participants = List.of(userA, userB, userC);
        ChoreSeries series = new ChoreSeries();

        // 7 occurrences starting at index 0
        User o0 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 0, 0, LocalDate.now()));
        User o1 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 0, 1, LocalDate.now()));
        User o2 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 0, 2, LocalDate.now()));
        User o3 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 0, 3, LocalDate.now()));
        User o4 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 0, 4, LocalDate.now()));
        User o5 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 0, 5, LocalDate.now()));
        User o6 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 0, 6, LocalDate.now()));

        assertEquals(userA, o0);
        assertEquals(userB, o1);
        assertEquals(userC, o2);
        assertEquals(userA, o3);
        assertEquals(userB, o4);
        assertEquals(userC, o5);
        assertEquals(userA, o6);
    }

    @Test
    @DisplayName("RoundRobinRotationStrategy debe respetar startIndex desplazado")
    void roundRobinStrategyShouldRespectNonZeroStartIndex() {
        List<User> participants = List.of(userA, userB, userC);
        ChoreSeries series = new ChoreSeries();

        // Start index = 1 (Borja)
        User o0 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 1, 0, LocalDate.now()));
        User o1 = roundRobinStrategy
                .determineAssignee(new ChoreAssignmentContext(series, participants, 1, 1, LocalDate.now()));

        assertEquals(userB, o0);
        assertEquals(userC, o1);
    }

    @Test
    @DisplayName("RoundRobinRotationStrategy debe lanzar excepcion si lista es null o vacia")
    void roundRobinStrategyShouldThrowWhenNullOrEmpty() {
        ChoreAssignmentContext ctxEmpty = new ChoreAssignmentContext(
                new ChoreSeries(),
                Collections.emptyList(),
                0,
                0,
                LocalDate.now());
        assertThrows(BusinessRuleValidationException.class, () -> roundRobinStrategy.determineAssignee(ctxEmpty));

        ChoreAssignmentContext ctxNull = new ChoreAssignmentContext(
                new ChoreSeries(),
                null,
                0,
                0,
                LocalDate.now());
        assertThrows(BusinessRuleValidationException.class, () -> roundRobinStrategy.determineAssignee(ctxNull));
    }

    @Test
    @DisplayName("FixedAssigneeStrategy debe lanzar excepcion si lista es null")
    void fixedAssigneeStrategyShouldThrowWhenNull() {
        ChoreAssignmentContext ctxNull = new ChoreAssignmentContext(
                new ChoreSeries(),
                null,
                0,
                0,
                LocalDate.now());
        assertThrows(BusinessRuleValidationException.class, () -> fixedStrategy.determineAssignee(ctxNull));
    }

    @Test
    @DisplayName("ChoreAssignmentStrategyResolver debe lanzar excepcion si la estrategia no esta registrada")
    void resolverShouldThrowWhenStrategyNotRegistered() {
        ChoreAssignmentStrategyResolver emptyResolver = new ChoreAssignmentStrategyResolver(List.of());
        assertThrows(BusinessRuleValidationException.class, () -> emptyResolver.resolve(RotationType.ROUND_ROBIN));
    }
}
