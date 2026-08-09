package com.vvu981.colivibackend.features.report.repository;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class ReportSpecification {

    public static Specification<Report> hasStatus(ReportStatus status) {
        return (root, query, criteriaBuilder) ->
                status == null ? null : criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<Report> hasTargetType(TargetType type) {
        return (root, query, criteriaBuilder) ->
                type == null ? null : criteriaBuilder.equal(root.get("targetType"), type);
    }

    public static Specification<Report> hasReason(ReportReason reason) {
        return (root, query, criteriaBuilder) ->
                reason == null ? null : criteriaBuilder.equal(root.get("reason"), reason);
    }

    public static Specification<Report> createdAfter(LocalDateTime from) {
        return (root, query, criteriaBuilder) ->
                from == null ? null : criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<Report> createdBefore(LocalDateTime to) {
        return (root, query, criteriaBuilder) ->
                to == null ? null : criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), to);
    }

    public static Specification<Report> buildFilter(
            ReportStatus status, TargetType type, ReportReason reason, LocalDateTime from, LocalDateTime to) {
        return Specification.where(hasStatus(status))
                .and(hasTargetType(type))
                .and(hasReason(reason))
                .and(createdAfter(from))
                .and(createdBefore(to));
    }
}
