package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.features.report.domain.TargetType;
import com.vvu981.colivibackend.features.report.dto.ReportFilterRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminReportService {

    Page<ReportResponse> listReports(ReportFilterRequest filters, Pageable pageable);

    Page<ReportTargetCountDTO> getMostReportedTargets(TargetType type, Pageable pageable);

    ReportResponse updateReportStatus(UUID reportId, ReportStatusUpdateRequest request, UUID adminId);
}
