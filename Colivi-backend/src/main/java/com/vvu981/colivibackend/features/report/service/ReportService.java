package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportFeedbackResponse;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;

import java.util.List;
import java.util.UUID;

public interface ReportService {

    ReportResponse createReport(UUID reporterId, CreateReportRequest request);

    List<ReportFeedbackResponse> getPendingFeedback(UUID reporterId);

    void acknowledgeFeedback(UUID reporterId, UUID reportId);
}

