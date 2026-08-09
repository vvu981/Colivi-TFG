package com.vvu981.colivibackend.features.report.repository.specification;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportSpecificationBuilderTest {

    @Mock
    private Root<Report> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder builder;

    @Test
    void statusFilter_shouldApply() {
        ReportStatusFilter filter = new ReportStatusFilter();
        assertThat(filter.isApplicable(Map.of("status", "PENDING"))).isTrue();
        assertThat(filter.isApplicable(Map.of())).isFalse();
        assertThat(filter.isApplicable(null)).isFalse();
        assertThat(filter.isApplicable(Map.of("status", "   "))).isFalse();

        Path<Object> path = mock(Path.class);
        when(root.get("status")).thenReturn(path);
        Predicate predicate = mock(Predicate.class);
        when(builder.equal(path, ReportStatus.PENDING)).thenReturn(predicate);

        Specification<Report> spec = filter.apply(Map.of("status", "PENDING"));
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void targetTypeFilter_shouldApply() {
        ReportTargetTypeFilter filter = new ReportTargetTypeFilter();
        assertThat(filter.isApplicable(Map.of("targetType", "USER"))).isTrue();
        assertThat(filter.isApplicable(Map.of())).isFalse();
        assertThat(filter.isApplicable(null)).isFalse();
        assertThat(filter.isApplicable(Map.of("targetType", "   "))).isFalse();

        Path<Object> path = mock(Path.class);
        when(root.get("targetType")).thenReturn(path);
        Predicate predicate = mock(Predicate.class);
        when(builder.equal(path, TargetType.USER)).thenReturn(predicate);

        Specification<Report> spec = filter.apply(Map.of("targetType", "USER"));
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void reasonFilter_shouldApply() {
        ReportReasonFilter filter = new ReportReasonFilter();
        assertThat(filter.isApplicable(Map.of("reason", "SPAM"))).isTrue();
        assertThat(filter.isApplicable(Map.of())).isFalse();
        assertThat(filter.isApplicable(null)).isFalse();
        assertThat(filter.isApplicable(Map.of("reason", "   "))).isFalse();

        Path<Object> path = mock(Path.class);
        when(root.get("reason")).thenReturn(path);
        Predicate predicate = mock(Predicate.class);
        when(builder.equal(path, ReportReason.SPAM)).thenReturn(predicate);

        Specification<Report> spec = filter.apply(Map.of("reason", "SPAM"));
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void dateFromFilter_shouldApply() {
        ReportDateFromFilter filter = new ReportDateFromFilter();
        LocalDateTime now = LocalDateTime.now();
        String dateStr = now.format(DateTimeFormatter.ISO_DATE_TIME);
        
        assertThat(filter.isApplicable(Map.of("from", dateStr))).isTrue();
        assertThat(filter.isApplicable(Map.of())).isFalse();
        assertThat(filter.isApplicable(null)).isFalse();
        assertThat(filter.isApplicable(Map.of("from", "   "))).isFalse();

        Path<LocalDateTime> path = mock(Path.class);
        when(root.<LocalDateTime>get("createdAt")).thenReturn(path);
        Predicate predicate = mock(Predicate.class);
        when(builder.greaterThanOrEqualTo(eq(path), any(LocalDateTime.class))).thenReturn(predicate);

        Specification<Report> spec = filter.apply(Map.of("from", dateStr));
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void dateToFilter_shouldApply() {
        ReportDateToFilter filter = new ReportDateToFilter();
        LocalDateTime now = LocalDateTime.now();
        String dateStr = now.format(DateTimeFormatter.ISO_DATE_TIME);
        
        assertThat(filter.isApplicable(Map.of("to", dateStr))).isTrue();
        assertThat(filter.isApplicable(Map.of())).isFalse();
        assertThat(filter.isApplicable(null)).isFalse();
        assertThat(filter.isApplicable(Map.of("to", "   "))).isFalse();

        Path<LocalDateTime> path = mock(Path.class);
        when(root.<LocalDateTime>get("createdAt")).thenReturn(path);
        Predicate predicate = mock(Predicate.class);
        when(builder.lessThanOrEqualTo(eq(path), any(LocalDateTime.class))).thenReturn(predicate);

        Specification<Report> spec = filter.apply(Map.of("to", dateStr));
        Predicate result = spec.toPredicate(root, query, builder);

        assertThat(result).isEqualTo(predicate);
    }

    @Test
    void builder_shouldCombineFilters() {
        ReportFilter mockFilter1 = mock(ReportFilter.class);
        ReportFilter mockFilter2 = mock(ReportFilter.class);
        Map<String, String> params = Map.of("status", "PENDING");

        when(mockFilter1.isApplicable(params)).thenReturn(true);
        when(mockFilter2.isApplicable(params)).thenReturn(false);

        Specification<Report> spec1 = (root, query, builder) -> null;
        when(mockFilter1.apply(params)).thenReturn(spec1);

        ReportSpecificationBuilder builder = new ReportSpecificationBuilder(List.of(mockFilter1, mockFilter2));

        Specification<Report> finalSpec = builder.buildSpecification(params);

        assertThat(finalSpec).isNotNull();
        verify(mockFilter1).apply(params);
        verify(mockFilter2, never()).apply(any());
    }
}
