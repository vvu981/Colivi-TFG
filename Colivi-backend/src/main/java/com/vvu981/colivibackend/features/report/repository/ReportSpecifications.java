package com.vvu981.colivibackend.features.report.repository;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public class ReportSpecifications {

    private ReportSpecifications() {
        // Prevent instantiation
    }

    public static Specification<Report> hasStatus(ReportStatus status) {
        return (root, query, cb) -> {
            if (status == null)
                return null;
            return cb.equal(root.get("status"), status);
        };

    }

    public static Specification<Report> hasTargetType(ReportTargetType targetType) {
        return (root, query, cb) -> {
            if (targetType == null)
                return null;
            return cb.equal(root.get("targetType"), targetType);
        };
    }

    public static Specification<Report> hasTargetId(UUID targetId) {
        return (root, query, cb) -> {
            if (targetId == null)
                return null;
            return cb.equal(root.get("targetId"), targetId);
        };
    }

    public static Specification<Report> hasReporterId(UUID reporterId) {
        return (root, query, cb) -> {
            if (reporterId == null)
                return null;
            return cb.equal(root.get("reporterId"), reporterId);
        };
    }

    public static Specification<Report> hasReason(ReportReason reason) {
        return (root, query, cb) -> {
            if (reason == null)
                return null;
            return cb.equal(root.get("reason"), reason);
        };

    }

    public static Specification<Report> createdAfter(LocalDate from) {
        return (root, query, cb) -> {
            if (from == null)
                return null;
            return cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay());
        };

    }

    public static Specification<Report> createdBefore(LocalDate to) {
        return (root, query, cb) -> {
            if (to == null)
                return null;
            return cb.lessThanOrEqualTo(root.get("createdAt"), to.atTime(LocalTime.MAX));
        };

    }
}
