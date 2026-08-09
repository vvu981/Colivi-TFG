package com.vvu981.colivibackend.features.report.controller;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import com.vvu981.colivibackend.features.report.dto.ReportFilterRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import com.vvu981.colivibackend.features.report.service.AdminReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping
    public ResponseEntity<Page<ReportResponse>> listReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) TargetType targetType,
            @RequestParam(required = false) ReportReason reason,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Pageable pageable) {
        
        ReportFilterRequest filters = new ReportFilterRequest(status, targetType, reason, from, to);
        Page<ReportResponse> response = adminReportService.listReports(filters, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/most-reported")
    public ResponseEntity<Page<ReportTargetCountDTO>> getMostReported(
            @RequestParam(required = false) TargetType type,
            Pageable pageable) {
        Page<ReportTargetCountDTO> response = adminReportService.getMostReportedTargets(type, pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{reportId}/status")
    public ResponseEntity<ReportResponse> updateStatus(
            @PathVariable UUID reportId,
            @Valid @RequestBody ReportStatusUpdateRequest request,
            @AuthenticationPrincipal(expression = "id") UUID adminId) {
        ReportResponse response = adminReportService.updateReportStatus(reportId, request, adminId);
        return ResponseEntity.ok(response);
    }
}
