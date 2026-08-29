package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportResolvedEvent;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import com.vvu981.colivibackend.features.report.mapper.ReportMapper;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.report.repository.ReportSpecifications;
import com.vvu981.colivibackend.features.report.dto.ReportFilterCriteriaDto;
import lombok.RequiredArgsConstructor;

import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminReportServiceImpl implements AdminReportService {

    private final ReportRepository reportRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ReportMapper reportMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ReportResponse> listReports(ReportFilterCriteriaDto criteria, Pageable pageable) {
        Specification<Report> spec = Specification.where(ReportSpecifications.hasStatus(criteria.status()))
                .and(ReportSpecifications.hasTargetType(criteria.targetType()))
                .and(ReportSpecifications.hasTargetId(criteria.targetId()))
                .and(ReportSpecifications.hasReporterId(criteria.reporterId()))
                .and(ReportSpecifications.hasReason(criteria.reason()))
                .and(ReportSpecifications.createdAfter(criteria.from()))
                .and(ReportSpecifications.createdBefore(criteria.to()));

        return reportRepository.findAll(spec, pageable).map(reportMapper::toResponse);
    }

    @Override
    public Page<ReportTargetCountDTO> getMostReportedTargets(ReportTargetType type, Pageable pageable) {
        return reportRepository.findMostReportedTargets(type, pageable);
    }

    @Override
    @Transactional
    public ReportResponse updateReportStatus(UUID reportId, ReportStatusUpdateRequest request, UUID adminId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Denuncia no encontrada."));

        ReportStatus newStatus = request.status();

        if (newStatus == ReportStatus.PENDING || newStatus == ReportStatus.CANCELLED) {
            throw new BusinessRuleValidationException(
                    "No puedes cambiar el estado a PENDING o CANCELLED manualmente.");
        }

        if (newStatus == ReportStatus.INVESTIGATING) {
            report.investigate(adminId);
        } else if (newStatus == ReportStatus.RESOLVED) {
            report.resolve(request.adminNotes(), adminId);
        } else {
            report.dismiss(request.adminNotes(), adminId);
        }

        Report savedReport = reportRepository.save(report);

        // Si se resuelve de forma crítica, publicamos evento de moderación de dominio
        if (newStatus == ReportStatus.RESOLVED) {
            eventPublisher.publishEvent(new ReportResolvedEvent(
                    savedReport.getId(),
                    savedReport.getTargetType(),
                    savedReport.getTargetId(),
                    savedReport.getResolverId(),
                    savedReport.getAdminNotes()));
        }

        return reportMapper.toResponse(savedReport);
    }

    @Override
    @Transactional
    public void updateBulkReportStatus(
            com.vvu981.colivibackend.features.report.dto.BulkReportStatusUpdateRequest request, UUID adminId) {
        if (request.status() == ReportStatus.PENDING || request.status() == ReportStatus.CANCELLED) {
            throw new BusinessRuleValidationException(
                    "Solo puedes cambiar masivamente a INVESTIGATING, RESOLVED o DISMISSED.");
        }

        List<Report> reports = reportRepository.findAllById(request.reportIds());

        if (reports.size() != request.reportIds().size()) {
            throw new ResourceNotFoundException(
                    "Algunos IDs de denuncia proporcionados no existen.");
        }

        for (Report report : reports) {
            ReportStatus newStatus = request.status();

            if (newStatus == ReportStatus.INVESTIGATING) {
                report.investigate(adminId);
            } else if (newStatus == ReportStatus.RESOLVED) {
                report.resolve(request.adminNotes(), adminId);
            } else {
                report.dismiss(request.adminNotes(), adminId);
            }

            if (newStatus == ReportStatus.RESOLVED) {
                eventPublisher.publishEvent(new ReportResolvedEvent(
                        report.getId(),
                        report.getTargetType(),
                        report.getTargetId(),
                        report.getResolverId(),
                        report.getAdminNotes()));
            }
        }

        reportRepository.saveAll(reports);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(UUID id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el reporte con ID: " + id));
        return reportMapper.toResponse(report);
    }
}
