package com.vvu981.colivibackend.features.report.repository;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportSpecificationsTest {

    @Mock
    private Root<Report> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder builder;

    @Test
    void hasStatus_ShouldReturnEqualPredicate_WhenStatusIsNotNull() {
        ReportStatus status = ReportStatus.PENDING;
        Path<Object> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("status")).thenReturn(path);
        when(builder.equal(path, status)).thenReturn(predicate);

        Specification<Report> spec = ReportSpecifications.hasStatus(status);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void hasStatus_ShouldReturnNull_WhenStatusIsNull() {
        Specification<Report> spec = ReportSpecifications.hasStatus(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void hasTargetType_ShouldReturnEqualPredicate_WhenTypeIsNotNull() {
        ReportTargetType type = ReportTargetType.USER;
        Path<Object> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("targetType")).thenReturn(path);
        when(builder.equal(path, type)).thenReturn(predicate);

        Specification<Report> spec = ReportSpecifications.hasTargetType(type);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void hasTargetType_ShouldReturnNull_WhenTypeIsNull() {
        Specification<Report> spec = ReportSpecifications.hasTargetType(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void hasReason_ShouldReturnEqualPredicate_WhenReasonIsNotNull() {
        ReportReason reason = ReportReason.SPAM;
        Path<Object> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("reason")).thenReturn(path);
        when(builder.equal(path, reason)).thenReturn(predicate);

        Specification<Report> spec = ReportSpecifications.hasReason(reason);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void hasReason_ShouldReturnNull_WhenReasonIsNull() {
        Specification<Report> spec = ReportSpecifications.hasReason(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void createdAfter_ShouldReturnGreaterThanOrEqualTo_WhenFromIsNotNull() {
        LocalDate from = LocalDate.now();
        Path<LocalDateTime> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        doReturn(path).when(root).get("createdAt");
        when(builder.greaterThanOrEqualTo(path, from.atStartOfDay())).thenReturn(predicate);

        Specification<Report> spec = ReportSpecifications.createdAfter(from);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
        verify(builder).greaterThanOrEqualTo(path, from.atStartOfDay());
    }

    @Test
    void createdAfter_ShouldReturnNull_WhenFromIsNull() {
        Specification<Report> spec = ReportSpecifications.createdAfter(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void createdBefore_ShouldReturnLessThanOrEqualTo_WhenToIsNotNull() {
        LocalDate to = LocalDate.now();
        Path<LocalDateTime> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        doReturn(path).when(root).get("createdAt");
        when(builder.lessThanOrEqualTo(path, to.atTime(LocalTime.MAX))).thenReturn(predicate);

        Specification<Report> spec = ReportSpecifications.createdBefore(to);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
        verify(builder).lessThanOrEqualTo(path, to.atTime(LocalTime.MAX));
    }

    @Test
    void createdBefore_ShouldReturnNull_WhenToIsNull() {
        Specification<Report> spec = ReportSpecifications.createdBefore(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void hasTargetId_ShouldReturnEqualPredicate_WhenTargetIdIsNotNull() {
        java.util.UUID targetId = java.util.UUID.randomUUID();
        Path<Object> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("targetId")).thenReturn(path);
        when(builder.equal(path, targetId)).thenReturn(predicate);

        Specification<Report> spec = ReportSpecifications.hasTargetId(targetId);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void hasTargetId_ShouldReturnNull_WhenTargetIdIsNull() {
        Specification<Report> spec = ReportSpecifications.hasTargetId(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void hasReporterId_ShouldReturnEqualPredicate_WhenReporterIdIsNotNull() {
        java.util.UUID reporterId = java.util.UUID.randomUUID();
        Path<Object> path = mock(Path.class);
        Predicate predicate = mock(Predicate.class);

        when(root.get("reporterId")).thenReturn(path);
        when(builder.equal(path, reporterId)).thenReturn(predicate);

        Specification<Report> spec = ReportSpecifications.hasReporterId(reporterId);
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void hasReporterId_ShouldReturnNull_WhenReporterIdIsNull() {
        Specification<Report> spec = ReportSpecifications.hasReporterId(null);
        Predicate result = spec.toPredicate(root, query, builder);
        assertThat(result).isNull();
    }

    @Test
    void testPrivateConstructor() throws Exception {
        java.lang.reflect.Constructor<ReportSpecifications> constructor = ReportSpecifications.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        ReportSpecifications instance = constructor.newInstance();
        assertThat(instance).isNotNull();
    }
}
