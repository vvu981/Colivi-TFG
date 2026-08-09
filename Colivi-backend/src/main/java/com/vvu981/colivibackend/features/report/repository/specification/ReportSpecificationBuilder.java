package com.vvu981.colivibackend.features.report.repository.specification;

import com.vvu981.colivibackend.features.report.domain.Report;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ReportSpecificationBuilder {

    private final List<ReportFilter> filters;

    public ReportSpecificationBuilder(List<ReportFilter> filters) {
        this.filters = filters;
    }

    public Specification<Report> buildSpecification(Map<String, String> params) {
        Specification<Report> spec = Specification.where(null);

        for (ReportFilter filter : filters) {
            if (filter.isApplicable(params)) {
                spec = spec.and(filter.apply(params));
            }
        }

        return spec;
    }
}
