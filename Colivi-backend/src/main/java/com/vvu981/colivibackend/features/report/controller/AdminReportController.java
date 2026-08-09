package com.vvu981.colivibackend.features.report.controller;

import com.vvu981.colivibackend.features.report.dto.ReportFilterCriteriaDto;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import com.vvu981.colivibackend.features.report.service.AdminReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping
    public ResponseEntity<Page<ReportResponse>> listReports(
            @Valid ReportFilterCriteriaDto criteria,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ReportResponse> response = adminReportService.listReports(criteria, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/most-reported")
    public ResponseEntity<Page<ReportTargetCountDTO>> getMostReportedTargets(
            @RequestParam(required = false) ReportTargetType type,
            @PageableDefault(sort = "count", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ReportTargetCountDTO> response = adminReportService.getMostReportedTargets(type, pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReportResponse> updateReportStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ReportStatusUpdateRequest request,
            @AuthenticationPrincipal(expression = "id") UUID adminId) {

        ReportResponse response = adminReportService.updateReportStatus(id, request, adminId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/bulk-status")
    public ResponseEntity<Void> updateBulkReportStatus(
            @Valid @RequestBody com.vvu981.colivibackend.features.report.dto.BulkReportStatusUpdateRequest request,
            @AuthenticationPrincipal(expression = "id") UUID adminId) {

        adminReportService.updateBulkReportStatus(request, adminId);
        return ResponseEntity.noContent().build();
    }
}
