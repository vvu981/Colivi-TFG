package com.vvu981.colivibackend.features.report.repository.specification;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ReportStatusFilter implements ReportFilter {
    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("status") && !params.get("status").isBlank();
    }

    @Override
    public Specification<Report> apply(Map<String, String> params) {
        return (root, query, cb) -> cb.equal(root.get("status"), ReportStatus.valueOf(params.get("status").toUpperCase()));
    }
}
