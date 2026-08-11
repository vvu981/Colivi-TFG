package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportResolvedEvent;
import com.vvu981.colivibackend.features.report.dto.BulkReportStatusUpdateRequest;
import com.vvu981.colivibackend.features.report.dto.ReportFilterCriteriaDto;
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

    @Test
    void listReports_shouldReturnPage() {
        ReportFilterCriteriaDto filter = new ReportFilterCriteriaDto(
                null, null, null, null, null, null, null);
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Report> page = new PageImpl<>(List.of(report));

        when(reportRepository.findAll(any(Specification.class), eq(pageRequest))).thenReturn(page);

        Page<ReportResponse> result = adminReportService.listReports(filter, pageRequest);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getMostReportedTargets_shouldReturnPage() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<ReportTargetCountDTO> page = new PageImpl<>(List.of());

        when(reportRepository.findMostReportedTargets(ReportTargetType.USER, pageRequest)).thenReturn(page);

        Page<ReportTargetCountDTO> result = adminReportService.getMostReportedTargets(ReportTargetType.USER,
                pageRequest);

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

    @Test
    void updateBulkReportStatus_shouldThrowException_whenStatusIsInvalid() {
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(List.of(reportId),
                ReportStatus.PENDING, null);

        assertThatThrownBy(() -> adminReportService.updateBulkReportStatus(request, adminId))
                .isInstanceOf(BusinessRuleValidationException.class);
    }

    @Test
    void updateBulkReportStatus_shouldThrowException_whenIdsDoNotMatch() {
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(
                List.of(reportId, UUID.randomUUID()), ReportStatus.DISMISSED, null);

        when(reportRepository.findAllById(request.reportIds())).thenReturn(List.of(report));

        assertThatThrownBy(() -> adminReportService.updateBulkReportStatus(request, adminId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateBulkReportStatus_shouldProcessSuccessfully() {
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(
                List.of(reportId), ReportStatus.DISMISSED, "Spam");

        when(reportRepository.findAllById(request.reportIds())).thenReturn(List.of(report));

        adminReportService.updateBulkReportStatus(request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.DISMISSED);
        assertThat(report.getAdminNotes()).isEqualTo("Spam");
        verify(reportRepository).saveAll(anyList());
    }

    @Test
    void updateBulkReportStatus_shouldInvestigate() {
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(
                List.of(reportId), ReportStatus.INVESTIGATING, null);
        when(reportRepository.findAllById(request.reportIds())).thenReturn(List.of(report));

        adminReportService.updateBulkReportStatus(request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.INVESTIGATING);
        verify(reportRepository).saveAll(anyList());
    }

    @Test
    void updateBulkReportStatus_shouldResolveAndPublishEvent() {
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(
                List.of(reportId), ReportStatus.RESOLVED, "Banned user");
        when(reportRepository.findAllById(request.reportIds())).thenReturn(List.of(report));

        adminReportService.updateBulkReportStatus(request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.RESOLVED);
        verify(eventPublisher).publishEvent(any(ReportResolvedEvent.class));
        verify(reportRepository).saveAll(anyList());
    }

    @Test
    void updateReportStatus_shouldThrowException_whenStatusIsInvalid() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.PENDING, null);
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        
        assertThatThrownBy(() -> adminReportService.updateReportStatus(reportId, request, adminId))
                .isInstanceOf(BusinessRuleValidationException.class);
    }

    @Test
    void getReportById_shouldReturnResponse() {
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        ReportResponse responseMock = new ReportResponse(reportId, null, null, null, null, null, null, null, null, null, null, null);
        when(reportMapper.toResponse(report)).thenReturn(responseMock);

        ReportResponse result = adminReportService.getReportById(reportId);

        assertThat(result).isNotNull();
    }

    @Test
    void getReportById_shouldThrowException_whenNotFound() {
        when(reportRepository.findById(reportId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminReportService.getReportById(reportId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
