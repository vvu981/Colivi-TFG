package com.vvu981.colivibackend.features.report.controller;

import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportFeedbackResponse;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(
            @Valid @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal(expression = "id") UUID reporterId) {
        ReportResponse response = reportService.createReport(reporterId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/pending-feedback")
    public ResponseEntity<List<ReportFeedbackResponse>> getPendingFeedback(
            @AuthenticationPrincipal(expression = "id") UUID reporterId) {
        List<ReportFeedbackResponse> feedback = reportService.getPendingFeedback(reporterId);
        return ResponseEntity.ok(feedback);
    }

    @PatchMapping("/{id}/acknowledge-feedback")
    public ResponseEntity<Void> acknowledgeFeedback(
            @AuthenticationPrincipal(expression = "id") UUID reporterId,
            @PathVariable UUID id) {
        reportService.acknowledgeFeedback(reporterId, id);
        return ResponseEntity.noContent().build();
    }
}

