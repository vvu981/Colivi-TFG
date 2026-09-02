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
                null, null, null, null, null, null, null, null, null);
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Report> page = new PageImpl<>(List.of(report));

        when(reportRepository.findAll(any(Specification.class), eq(pageRequest))).thenReturn(page);

        Page<ReportResponse> result = adminReportService.listReports(filter, pageRequest);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void listReports_withAllFiltersPopulated_shouldReturnPage() {
        ReportFilterCriteriaDto filter = new ReportFilterCriteriaDto(
                UUID.randomUUID(), ReportStatus.PENDING, ReportTargetType.USER, UUID.randomUUID(), UUID.randomUUID(),
                com.vvu981.colivibackend.features.report.domain.ReportReason.SPAM,
                java.time.LocalDate.now().minusDays(2), java.time.LocalDate.now(), "search");
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Report> page = new PageImpl<>(List.of(report));

        when(reportRepository.findAll(any(Specification.class), eq(pageRequest))).thenReturn(page);

        Page<ReportResponse> result = adminReportService.listReports(filter, pageRequest);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void listReports_withIdAndQuery_shouldReturnPage() {
        ReportFilterCriteriaDto filter = new ReportFilterCriteriaDto(
                UUID.randomUUID(), ReportStatus.PENDING, ReportTargetType.LISTING,
                UUID.randomUUID(), UUID.randomUUID(),
                com.vvu981.colivibackend.features.report.domain.ReportReason.SPAM,
                java.time.LocalDate.now().minusDays(2), java.time.LocalDate.now(), "search-term");
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Report> page = new PageImpl<>(List.of(report));

        when(reportRepository.findAll(any(Specification.class), eq(pageRequest))).thenReturn(page);

        Page<ReportResponse> result = adminReportService.listReports(filter, pageRequest);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getMostReportedTargets_withListingType_shouldReturnPage() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<ReportTargetCountDTO> page = new PageImpl<>(List.of());

        when(reportRepository.findMostReportedListingsUnbanned(pageRequest)).thenReturn(page);

        Page<ReportTargetCountDTO> result = adminReportService.getMostReportedTargets(ReportTargetType.LISTING,
                pageRequest);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void getMostReportedTargets_withUserType_shouldReturnPage() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<ReportTargetCountDTO> page = new PageImpl<>(List.of());

        when(reportRepository.findMostReportedUsersUnbanned(pageRequest)).thenReturn(page);

        Page<ReportTargetCountDTO> result = adminReportService.getMostReportedTargets(ReportTargetType.USER,
                pageRequest);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void getMostReportedTargets_withoutType_shouldReturnPage() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<ReportTargetCountDTO> page = new PageImpl<>(List.of());

        when(reportRepository.findAllMostReportedUnbanned(pageRequest)).thenReturn(page);

        Page<ReportTargetCountDTO> result = adminReportService.getMostReportedTargets(null, pageRequest);

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
    void updateReportStatus_shouldThrowException_whenStatusIsInvalid() {
        ReportStatusUpdateRequest request1 = new ReportStatusUpdateRequest(ReportStatus.PENDING, null);
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        
        assertThatThrownBy(() -> adminReportService.updateReportStatus(reportId, request1, adminId))
                .isInstanceOf(BusinessRuleValidationException.class);

        ReportStatusUpdateRequest request2 = new ReportStatusUpdateRequest(ReportStatus.CANCELLED, null);
        assertThatThrownBy(() -> adminReportService.updateReportStatus(reportId, request2, adminId))
                .isInstanceOf(BusinessRuleValidationException.class);
    }

    @Test
    void updateReportStatus_shouldInvestigateSuccessfully() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.INVESTIGATING, null);
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

        adminReportService.updateReportStatus(reportId, request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.INVESTIGATING);
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void updateReportStatus_shouldDismissSuccessfully() {
        ReportStatusUpdateRequest request = new ReportStatusUpdateRequest(ReportStatus.DISMISSED, "Dismiss reason");
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

        adminReportService.updateReportStatus(reportId, request, adminId);

        assertThat(report.getStatus()).isEqualTo(ReportStatus.DISMISSED);
        assertThat(report.getAdminNotes()).isEqualTo("Dismiss reason");
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void updateBulkReportStatus_shouldThrowException_whenStatusIsCancelled() {
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(List.of(reportId),
                ReportStatus.CANCELLED, null);

        assertThatThrownBy(() -> adminReportService.updateBulkReportStatus(request, adminId))
                .isInstanceOf(BusinessRuleValidationException.class);
    }

    @Test
    void updateBulkReportStatus_shouldThrowException_whenSomeReportIdsNotFound() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(
                List.of(id1, id2), ReportStatus.RESOLVED, "Notes");

        when(reportRepository.bulkUpdateStatusByIds(eq(request.reportIds()), eq(ReportStatus.RESOLVED), eq("Notes"), eq(adminId), any(), any()))
                .thenReturn(1);

        assertThatThrownBy(() -> adminReportService.updateBulkReportStatus(request, adminId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Algunos IDs");
    }

    @Test
    void updateBulkReportStatus_shouldUpdateSuccessfully() {
        BulkReportStatusUpdateRequest request = new BulkReportStatusUpdateRequest(
                List.of(reportId), ReportStatus.RESOLVED, "Resolved Notes");

        when(reportRepository.bulkUpdateStatusByIds(eq(request.reportIds()), eq(ReportStatus.RESOLVED), eq("Resolved Notes"), eq(adminId), any(), any()))
                .thenReturn(1);

        adminReportService.updateBulkReportStatus(request, adminId);

        verify(reportRepository).bulkUpdateStatusByIds(eq(request.reportIds()), eq(ReportStatus.RESOLVED), eq("Resolved Notes"), eq(adminId), any(), any());
    }

    @Test
    void resolveAllOpenReportsForTarget_shouldUpdateSuccessfully() {
        UUID targetId = UUID.randomUUID();
        adminReportService.resolveAllOpenReportsForTarget(targetId, ReportStatus.RESOLVED, "Closed", adminId);

        verify(reportRepository).bulkUpdateStatusByTargetId(eq(targetId), eq(ReportStatus.RESOLVED), eq(List.of(ReportStatus.PENDING, ReportStatus.INVESTIGATING)), eq("Closed"), eq(adminId), any(), any());
    }

    @Test
    void resolveAllOpenReportsForTarget_shouldThrowException_whenInvalidStatus() {
        UUID targetId = UUID.randomUUID();
        assertThatThrownBy(() -> adminReportService.resolveAllOpenReportsForTarget(targetId, ReportStatus.PENDING, "Closed", adminId))
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
