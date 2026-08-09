package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ReportService {

    ReportResponse createReport(UUID reporterId, CreateReportRequest request);

    Page<ReportResponse> getUserReports(UUID reporterId, Pageable pageable);

    void cancelReport(UUID reporterId, UUID reportId);
}
