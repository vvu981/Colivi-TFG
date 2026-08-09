package com.vvu981.colivibackend.features.report.repository.specification;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ReportReasonFilter implements ReportFilter {
    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("reason") && !params.get("reason").isBlank();
    }

    @Override
    public Specification<Report> apply(Map<String, String> params) {
        return (root, query, cb) -> cb.equal(root.get("reason"), ReportReason.valueOf(params.get("reason").toUpperCase()));
    }
}
