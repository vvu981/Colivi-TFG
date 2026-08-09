package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.home.repository.HomeExpenseRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportCreatedEvent;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.mapper.ReportMapper;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final ReportMapper reportMapper;
    private final ApplicationEventPublisher eventPublisher;

    private final UserRepository userRepository;
    private final AccommodationListingRepository listingRepository;
    private final HomeRepository homeRepository;
    private final HomeExpenseRepository expenseRepository;

    @Override
    @Transactional
    public ReportResponse createReport(UUID reporterId, CreateReportRequest request) {

        // 1. Evitar auto-denuncia
        if (request.targetType() == ReportTargetType.USER && request.targetId().equals(reporterId)) {
            throw new BusinessRuleValidationException("No puedes denunciarte a ti mismo.");
        }

        // 2. Verificar existencia del objetivo
        boolean targetExists = switch (request.targetType()) {
            case USER -> userRepository.existsById(request.targetId());
            case LISTING -> listingRepository.existsById(request.targetId());
            case HOME -> homeRepository.existsById(request.targetId());
            case EXPENSE -> expenseRepository.existsById(request.targetId());
        };

        if (!targetExists) {
            throw new BusinessRuleValidationException("El elemento denunciado no existe.");
        }

        // 3. Verificar denuncia duplicada activa
        boolean hasActiveReport = reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
                reporterId,
                request.targetType(),
                request.targetId(),
                List.of(ReportStatus.PENDING, ReportStatus.INVESTIGATING));

        if (hasActiveReport) {
            throw new BusinessRuleValidationException("Ya tienes una denuncia activa para este elemento.");
        }

        // 4. Crear denuncia
        Report report = reportMapper.toEntity(request);
        report.setReporterId(reporterId);

        Report savedReport = reportRepository.save(report);

        // 5. Publicar evento de dominio
        eventPublisher.publishEvent(new ReportCreatedEvent(
                savedReport.getId(),
                savedReport.getReporterId(),
                savedReport.getTargetType(),
                savedReport.getTargetId()));

        return reportMapper.toResponse(savedReport);
    }

    @Override
    public Page<ReportResponse> getUserReports(UUID reporterId, Pageable pageable) {
        return reportRepository.findByReporterId(reporterId, pageable)
                .map(reportMapper::toResponse);
    }

    @Override
    @Transactional
    public void cancelReport(UUID reporterId, UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Denuncia no encontrada."));

        report.cancel(reporterId);
        reportRepository.save(report);
    }
}
