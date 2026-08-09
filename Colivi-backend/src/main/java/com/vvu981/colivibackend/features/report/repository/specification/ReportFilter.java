package com.vvu981.colivibackend.features.report.repository.specification;

import com.vvu981.colivibackend.features.report.domain.Report;
import org.springframework.data.jpa.domain.Specification;

import java.util.Map;

public interface ReportFilter {
    boolean isApplicable(Map<String, String> params);
    Specification<Report> apply(Map<String, String> params);
}
