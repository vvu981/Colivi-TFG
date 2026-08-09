package com.vvu981.colivibackend.features.report.repository.specification;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ReportTargetTypeFilter implements ReportFilter {
    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("targetType") && !params.get("targetType").isBlank();
    }

    @Override
    public Specification<Report> apply(Map<String, String> params) {
        return (root, query, cb) -> cb.equal(root.get("targetType"), TargetType.valueOf(params.get("targetType").toUpperCase()));
    }
}
