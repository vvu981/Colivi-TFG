package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportResolvedEvent;
import com.vvu981.colivibackend.features.report.dto.ReportFilterRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import com.vvu981.colivibackend.features.report.mapper.ReportMapper;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.report.repository.ReportSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminReportServiceImpl implements AdminReportService {

    private final ReportRepository reportRepository;
    private final ReportMapper reportMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public Page<ReportResponse> listReports(ReportFilterRequest filters, Pageable pageable) {
        Specification<Report> spec = ReportSpecification.buildFilter(
                filters.status(),
                filters.targetType(),
                filters.reason(),
                filters.from(),
                filters.to()
        );

        return reportRepository.findAll(spec, pageable).map(reportMapper::toResponse);
    }

    @Override
    public Page<ReportTargetCountDTO> getMostReportedTargets(TargetType type, Pageable pageable) {
        return reportRepository.findMostReportedTargets(type, pageable);
    }

    @Override
    @Transactional
    public ReportResponse updateReportStatus(UUID reportId, ReportStatusUpdateRequest request, UUID adminId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Denuncia no encontrada."));

        ReportStatus currentStatus = report.getStatus();
        ReportStatus newStatus = request.status();

        if (newStatus == ReportStatus.INVESTIGATING) {
            report.investigate(adminId);
        } else if (newStatus == ReportStatus.RESOLVED) {
            report.resolve(request.adminNotes(), adminId);
        } else if (newStatus == ReportStatus.DISMISSED) {
            report.dismiss(request.adminNotes(), adminId);
        }

        Report savedReport = reportRepository.save(report);

        // Si se resuelve de forma crítica, publicamos evento de moderación de dominio
        if (newStatus == ReportStatus.RESOLVED && currentStatus != ReportStatus.RESOLVED) {
            eventPublisher.publishEvent(new ReportResolvedEvent(
                    savedReport.getId(),
                    savedReport.getTargetType(),
                    savedReport.getTargetId(),
                    savedReport.getResolverId(),
                    savedReport.getAdminNotes()
            ));
        }

        return reportMapper.toResponse(savedReport);
    }
}
