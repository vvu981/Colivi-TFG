package com.vvu981.colivibackend.features.report.repository.specification;

import com.vvu981.colivibackend.features.report.domain.Report;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
public class ReportDateToFilter implements ReportFilter {
    @Override
    public boolean isApplicable(Map<String, String> params) {
        return params != null && params.containsKey("to") && !params.get("to").isBlank();
    }

    @Override
    public Specification<Report> apply(Map<String, String> params) {
        return (root, query, cb) -> {
            LocalDateTime to = LocalDateTime.parse(params.get("to"), DateTimeFormatter.ISO_DATE_TIME);
            return cb.lessThanOrEqualTo(root.get("createdAt"), to);
        };
    }
}
