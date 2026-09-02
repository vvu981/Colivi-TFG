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

import java.time.LocalDateTime;
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
        Specification<Report> spec = Specification.where(ReportSpecifications.hasId(criteria.id()))
                .and(ReportSpecifications.hasStatus(criteria.status()))
                .and(ReportSpecifications.hasTargetType(criteria.targetType()))
                .and(ReportSpecifications.hasTargetId(criteria.targetId()))
                .and(ReportSpecifications.hasReporterId(criteria.reporterId()))
                .and(ReportSpecifications.hasReason(criteria.reason()))
                .and(ReportSpecifications.hasQuery(criteria.query()))
                .and(ReportSpecifications.createdAfter(criteria.from()))
                .and(ReportSpecifications.createdBefore(criteria.to()));

        return reportRepository.findAll(spec, pageable).map(reportMapper::toResponse);
    }

    @Override
    public Page<ReportTargetCountDTO> getMostReportedTargets(ReportTargetType type, Pageable pageable) {
        if (type == ReportTargetType.LISTING) {
            return reportRepository.findMostReportedListingsUnbanned(pageable);
        } else if (type == ReportTargetType.USER) {
            return reportRepository.findMostReportedUsersUnbanned(pageable);
        }
        return reportRepository.findAllMostReportedUnbanned(pageable);
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

        LocalDateTime now = LocalDateTime.now();
        int updatedCount = reportRepository.bulkUpdateStatusByIds(
                request.reportIds(),
                request.status(),
                request.adminNotes(),
                adminId,
                request.status() == ReportStatus.INVESTIGATING ? null : now,
                now);

        if (updatedCount != request.reportIds().size()) {
            throw new ResourceNotFoundException(
                    "Algunos IDs de denuncia proporcionados no existen.");
        }
    }

    @Override
    @Transactional
    public void resolveAllOpenReportsForTarget(UUID targetId, ReportStatus newStatus, String adminNotes, UUID adminId) {
        if (newStatus == ReportStatus.PENDING || newStatus == ReportStatus.CANCELLED) {
            throw new BusinessRuleValidationException(
                    "Solo puedes cambiar masivamente a INVESTIGATING, RESOLVED o DISMISSED.");
        }

        LocalDateTime now = LocalDateTime.now();
        reportRepository.bulkUpdateStatusByTargetId(
                targetId,
                newStatus,
                List.of(ReportStatus.PENDING, ReportStatus.INVESTIGATING),
                adminNotes,
                adminId,
                newStatus == ReportStatus.INVESTIGATING ? null : now,
                now);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(UUID id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el reporte con ID: " + id));
        return reportMapper.toResponse(report);
    }
}
