package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportResolvedEvent;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.dto.ReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import com.vvu981.colivibackend.features.report.mapper.ReportMapper;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminReportServiceImplTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ReportMapper reportMapper;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AdminReportServiceImpl adminReportService;

    private UUID reportId;
    private UUID adminId;
    private Report report;

    @BeforeEach
    void setUp() {
        reportId = UUID.randomUUID();
        adminId = UUID.randomUUID();
        report = new Report();
        report.setId(reportId);
        report.setStatus(ReportStatus.PENDING);
    }

    @Mock
    private com.vvu981.colivibackend.features.report.repository.specification.ReportSpecificationBuilder specificationBuilder;

    @Test
    void listReports_shouldReturnPage() {
        Map<String, String> filter = java.util.Map.of();
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Report> page = new PageImpl<>(List.of(report));

        Specification<Report> spec = Specification.where(null);
        when(specificationBuilder.buildSpecification(filter)).thenReturn(spec);
        when(reportRepository.findAll(eq(spec), eq(pageRequest))).thenReturn(page);

        Page<ReportResponse> result = adminReportService.listReports(filter, pageRequest);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getMostReportedTargets_shouldReturnPage() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<ReportTargetCountDTO> page = new PageImpl<>(List.of());

        when(reportRepository.findMostReportedTargets(TargetType.USER, pageRequest)).thenReturn(page);

        Page<ReportTargetCountDTO> result = adminReportService.getMostReportedTargets(TargetType.USER, pageRequest);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void updateReportStatus_shouldThrowException_whenNotFound() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.INVESTIGATING, null);
        when(reportRepository.findById(reportId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminReportService.updateReportStatus(reportId, request, adminId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateReportStatus_shouldInvestigate() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.INVESTIGATING, null);
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);

        adminReportService.updateReportStatus(reportId, request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.INVESTIGATING);
        assertThat(report.getResolverId()).isEqualTo(adminId);
    }

    @Test
    void updateReportStatus_shouldDismiss() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.DISMISSED, "No violation");
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);

        adminReportService.updateReportStatus(reportId, request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.DISMISSED);
        assertThat(report.getAdminNotes()).isEqualTo("No violation");
    }

    @Test
    void updateReportStatus_shouldResolveAndPublishEvent() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.RESOLVED, "Banned user");
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);

        adminReportService.updateReportStatus(reportId, request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.RESOLVED);

        ArgumentCaptor<ReportResolvedEvent> captor = ArgumentCaptor.forClass(ReportResolvedEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        assertThat(captor.getValue().reportId()).isEqualTo(reportId);
    }

    @Test
    void updateReportStatus_shouldNotPublishEvent_whenAlreadyResolved() {
        report.setStatus(ReportStatus.RESOLVED);
        // We shouldn't hit resolve() if it's already resolved because
        // IllegalStateException would be thrown.
        // Let's test that exception.
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.RESOLVED, "Banned user");
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> adminReportService.updateReportStatus(reportId, request, adminId))
                .isInstanceOf(IllegalStateException.class);

        verify(eventPublisher, never()).publishEvent(any());
    }
}
