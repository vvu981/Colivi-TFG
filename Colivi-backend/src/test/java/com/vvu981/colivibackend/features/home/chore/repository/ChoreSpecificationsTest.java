package com.vvu981.colivibackend.features.home.chore.repository;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.lang.reflect.Constructor;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChoreSpecificationsTest {

    @Mock
    private Root<Chore> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder builder;

    @Test
    void withHomeId_ShouldReturnEqualPredicate() {
        UUID homeId = UUID.randomUUID();
        Path<Object> homePath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("home")).thenReturn(homePath);
        when(homePath.get("id")).thenReturn(idPath);
        when(builder.equal(idPath, homeId)).thenReturn(predicate);

        Specification<Chore> spec = ChoreSpecifications.withHomeId(homeId);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void withAssigneeId_ShouldReturnEqualPredicate_WhenNotNull() {
        UUID assigneeId = UUID.randomUUID();
        Path<Object> assigneePath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("assignee")).thenReturn(assigneePath);
        when(assigneePath.get("id")).thenReturn(idPath);
        when(builder.equal(idPath, assigneeId)).thenReturn(predicate);

        Specification<Chore> spec = ChoreSpecifications.withAssigneeId(assigneeId);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void withAssigneeId_ShouldReturnNull_WhenNull() {
        Specification<Chore> spec = ChoreSpecifications.withAssigneeId(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void withStatus_ShouldReturnEqualPredicate_WhenNotNull() {
        ChoreStatus status = ChoreStatus.PENDING;
        Path<Object> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("status")).thenReturn(path);
        when(builder.equal(path, status)).thenReturn(predicate);

        Specification<Chore> spec = ChoreSpecifications.withStatus(status);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void withStatus_ShouldReturnNull_WhenNull() {
        Specification<Chore> spec = ChoreSpecifications.withStatus(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void withDueDateFrom_ShouldReturnGtePredicate_WhenNotNull() {
        LocalDate from = LocalDate.now();
        Path<LocalDate> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        doReturn(path).when(root).get("dueDate");
        when(builder.greaterThanOrEqualTo(path, from)).thenReturn(predicate);

        Specification<Chore> spec = ChoreSpecifications.withDueDateFrom(from);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void withDueDateFrom_ShouldReturnNull_WhenNull() {
        Specification<Chore> spec = ChoreSpecifications.withDueDateFrom(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void withDueDateTo_ShouldReturnLtePredicate_WhenNotNull() {
        LocalDate to = LocalDate.now();
        Path<LocalDate> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        doReturn(path).when(root).get("dueDate");
        when(builder.lessThanOrEqualTo(path, to)).thenReturn(predicate);

        Specification<Chore> spec = ChoreSpecifications.withDueDateTo(to);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void withDueDateTo_ShouldReturnNull_WhenNull() {
        Specification<Chore> spec = ChoreSpecifications.withDueDateTo(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void withDueDateBefore_ShouldReturnLtPredicate_WhenNotNull() {
        LocalDate before = LocalDate.now();
        Path<LocalDate> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        doReturn(path).when(root).get("dueDate");
        when(builder.lessThan(path, before)).thenReturn(predicate);

        Specification<Chore> spec = ChoreSpecifications.withDueDateBefore(before);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void withDueDateBefore_ShouldReturnNull_WhenNull() {
        Specification<Chore> spec = ChoreSpecifications.withDueDateBefore(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    @SuppressWarnings("unchecked")
    void fetchAssociations_ShouldFetch_WhenNotCountQuery() {
        doReturn(Chore.class).when(query).getResultType();

        Specification<Chore> spec = ChoreSpecifications.fetchAssociations();
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isNull();
        verify(root).fetch("assignee", JoinType.LEFT);
        verify(root).fetch("completedBy", JoinType.LEFT);
    }

    @Test
    @SuppressWarnings("unchecked")
    void fetchAssociations_ShouldNotFetch_WhenCountQuery() {
        doReturn(Long.class).when(query).getResultType();

        Specification<Chore> spec = ChoreSpecifications.fetchAssociations();
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isNull();
        verify(root, never()).fetch(anyString(), any(JoinType.class));
    }

    @Test
    void testPrivateConstructor() throws Exception {
        Constructor<ChoreSpecifications> constructor = ChoreSpecifications.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        ChoreSpecifications instance = constructor.newInstance();
        assertThat(instance).isNotNull();
    }
}
