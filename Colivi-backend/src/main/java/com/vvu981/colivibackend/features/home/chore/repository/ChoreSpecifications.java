package com.vvu981.colivibackend.features.home.chore.repository;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public final class ChoreSpecifications {

    private ChoreSpecifications() {
        // Prevent instantiation
    }

    public static Specification<Chore> withHomeId(UUID homeId) {
        return (root, query, cb) -> cb.equal(root.get("home").get("id"), homeId);
    }

    public static Specification<Chore> withAssigneeId(UUID assigneeId) {
        return (root, query, cb) -> assigneeId == null ? null : cb.equal(root.get("assignee").get("id"), assigneeId);
    }

    public static Specification<Chore> withStatus(ChoreStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Chore> withDueDateFrom(LocalDate from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("dueDate"), from);
    }

    public static Specification<Chore> withDueDateTo(LocalDate to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("dueDate"), to);
    }

    public static Specification<Chore> fetchAssociations() {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("assignee", JoinType.LEFT);
                root.fetch("completedBy", JoinType.LEFT);
            }
            return null;
        };
    }
}
