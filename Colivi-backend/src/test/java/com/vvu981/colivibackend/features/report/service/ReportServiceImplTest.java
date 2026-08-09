package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.home.repository.HomeExpenseRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportCreatedEvent;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.mapper.ReportMapper;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
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

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock private ReportRepository reportRepository;
    @Mock private ReportMapper reportMapper;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private UserRepository userRepository;
    @Mock private AccommodationListingRepository listingRepository;
    @Mock private HomeRepository homeRepository;
    @Mock private HomeExpenseRepository expenseRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private UUID reporterId;
    private UUID targetId;

    @BeforeEach
    void setUp() {
        reporterId = UUID.randomUUID();
        targetId = UUID.randomUUID();
    }

    @Test
    void createReport_shouldThrowException_whenUserReportsThemselves() {
        CreateReportRequest request = new CreateReportRequest(TargetType.USER, reporterId, ReportReason.SPAM, "Test");

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("No puedes denunciarte a ti mismo.");
    }

    @Test
    void createReport_shouldThrowException_whenTargetDoesNotExist() {
        CreateReportRequest request = new CreateReportRequest(TargetType.USER, targetId, ReportReason.SPAM, "Test");
        when(userRepository.existsById(targetId)).thenReturn(false);

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("El elemento denunciado no existe.");
    }

    @Test
    void createReport_shouldThrowException_whenActiveReportExists() {
        CreateReportRequest request = new CreateReportRequest(TargetType.LISTING, targetId, ReportReason.SPAM, "Test");
        when(listingRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(eq(reporterId), eq(TargetType.LISTING), eq(targetId), any()))
                .thenReturn(true);

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("Ya tienes una denuncia activa para este elemento.");
    }

    @Test
    void createReport_shouldSaveAndPublishEvent_whenValid() {
        CreateReportRequest request = new CreateReportRequest(TargetType.HOME, targetId, ReportReason.FRAUD, "Test");
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setTargetType(TargetType.HOME);
        report.setTargetId(targetId);

        when(homeRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(any(), any(), any(), any())).thenReturn(false);
        when(reportMapper.toEntity(request)).thenReturn(report);
        when(reportRepository.save(report)).thenReturn(report);
        when(reportMapper.toResponse(report)).thenReturn(new ReportResponse(report.getId(), reporterId, TargetType.HOME, targetId, ReportReason.FRAUD, "Test", null, null, null, null, null, null));

        ReportResponse response = reportService.createReport(reporterId, request);

        assertThat(response).isNotNull();
        verify(reportRepository).save(report);
        
        ArgumentCaptor<ReportCreatedEvent> eventCaptor = ArgumentCaptor.forClass(ReportCreatedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        ReportCreatedEvent event = eventCaptor.getValue();
        assertThat(event.reportId()).isEqualTo(report.getId());
        assertThat(event.targetType()).isEqualTo(TargetType.HOME);
    }
    
    @Test
    void createReport_shouldCheckExpense_whenValid() {
        CreateReportRequest request = new CreateReportRequest(TargetType.EXPENSE, targetId, ReportReason.FRAUD, "Test");
        Report report = new Report();
        report.setId(UUID.randomUUID());

        when(expenseRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(any(), any(), any(), any())).thenReturn(false);
        when(reportMapper.toEntity(request)).thenReturn(report);
        when(reportRepository.save(report)).thenReturn(report);
        when(reportMapper.toResponse(report)).thenReturn(null);

        reportService.createReport(reporterId, request);

        verify(expenseRepository).existsById(targetId);
    }

    @Test
    void getUserReports_shouldReturnPage() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Report report = new Report();
        Page<Report> page = new PageImpl<>(List.of(report));
        
        when(reportRepository.findByReporterId(reporterId, pageRequest)).thenReturn(page);
        when(reportMapper.toResponse(report)).thenReturn(null);

        Page<ReportResponse> result = reportService.getUserReports(reporterId, pageRequest);
        
        assertThat(result.getContent()).hasSize(1);
        verify(reportRepository).findByReporterId(reporterId, pageRequest);
    }
}
