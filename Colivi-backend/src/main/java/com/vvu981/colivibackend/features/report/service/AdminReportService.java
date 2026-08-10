package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import com.vvu981.colivibackend.features.report.dto.ReportFilterCriteriaDto;
import com.vvu981.colivibackend.features.report.dto.BulkReportStatusUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminReportService {

    Page<ReportResponse> listReports(ReportFilterCriteriaDto criteria, Pageable pageable);

    Page<ReportTargetCountDTO> getMostReportedTargets(ReportTargetType type, Pageable pageable);

    ReportResponse updateReportStatus(UUID reportId, ReportStatusUpdateRequest request, UUID adminId);

    ReportResponse getReportById(UUID id);

    void updateBulkReportStatus(BulkReportStatusUpdateRequest request, UUID adminId);
}
