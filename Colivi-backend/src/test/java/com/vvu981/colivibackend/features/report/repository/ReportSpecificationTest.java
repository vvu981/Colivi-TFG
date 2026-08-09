package com.vvu981.colivibackend.features.report.repository;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ReportSpecificationTest {

    @Test
    void buildFilter_shouldReturnSpecification() {
        Specification<Report> spec = ReportSpecification.buildFilter(
                ReportStatus.PENDING,
                TargetType.USER,
                ReportReason.SPAM,
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now()
        );

        assertThat(spec).isNotNull();

        Root<Report> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        Path<Object> statusPath = mock(Path.class);
        Path<Object> typePath = mock(Path.class);
        Path<Object> reasonPath = mock(Path.class);
        Path<LocalDateTime> createdAtPath = mock(Path.class);
        
        when(root.get("status")).thenReturn(statusPath);
        when(root.get("targetType")).thenReturn(typePath);
        when(root.get("reason")).thenReturn(reasonPath);
        when(root.<LocalDateTime>get("createdAt")).thenReturn(createdAtPath);

        Predicate p1 = mock(Predicate.class);
        Predicate p2 = mock(Predicate.class);
        Predicate p3 = mock(Predicate.class);
        Predicate p4 = mock(Predicate.class);
        Predicate p5 = mock(Predicate.class);

        when(builder.equal(statusPath, ReportStatus.PENDING)).thenReturn(p1);
        when(builder.equal(typePath, TargetType.USER)).thenReturn(p2);
        when(builder.equal(reasonPath, ReportReason.SPAM)).thenReturn(p3);
        when(builder.greaterThanOrEqualTo(eq(createdAtPath), any(LocalDateTime.class))).thenReturn(p4);
        when(builder.lessThanOrEqualTo(eq(createdAtPath), any(LocalDateTime.class))).thenReturn(p5);
        when(builder.and(any(), any())).thenReturn(mock(Predicate.class));

        Predicate predicate = spec.toPredicate(root, query, builder);
        assertThat(predicate).isNotNull();
    }
    
    @Test
    void buildFilter_withNulls_shouldReturnSpecification() {
        Specification<Report> spec = ReportSpecification.buildFilter(null, null, null, null, null);
        assertThat(spec).isNotNull();
        
        Root<Report> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);
        
        Predicate predicate = spec.toPredicate(root, query, builder);
        assertThat(predicate).isNull(); // since all components are null, spring data returns null predicate
    }
}
