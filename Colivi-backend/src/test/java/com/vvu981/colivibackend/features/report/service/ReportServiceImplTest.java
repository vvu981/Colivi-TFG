package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.home.repository.HomeExpenseRepository;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportCreatedEvent;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import com.vvu981.colivibackend.features.report.mapper.ReportMapper;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.user.domain.User;
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
import com.vvu981.colivibackend.features.report.domain.ReportStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private ReportMapper reportMapper;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AccommodationListingRepository listingRepository;
    @Mock
    private HomeRepository homeRepository;
    @Mock
    private HomeExpenseRepository expenseRepository;

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
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.USER, reporterId, ReportReason.SPAM,
                "Test");

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("No puedes denunciarte a ti mismo.");
    }

    @Test
    void createReport_shouldThrowException_whenHostReportsOwnListing() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.LISTING, targetId, ReportReason.SPAM,
                "Test");
        User host = new User();
        host.setId(reporterId);
        AccommodationListing listing = new AccommodationListing();
        listing.setId(targetId);
        listing.setHost(host);

        when(listingRepository.findById(targetId)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("No puedes denunciar tu propio anuncio.");
    }

    @Test
    void createReport_shouldThrowException_whenTargetDoesNotExist() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.USER, targetId, ReportReason.SPAM,
                "Test");
        when(userRepository.existsById(targetId)).thenReturn(false);

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("El elemento denunciado no existe.");
    }

    @Test
    void createReport_shouldThrowException_whenListingTargetDoesNotExist() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.LISTING, targetId, ReportReason.SPAM,
                "Test");
        when(listingRepository.findById(targetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("El elemento denunciado no existe.");
    }

    @Test
    void createReport_shouldThrowException_whenActiveReportExists() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.LISTING, targetId, ReportReason.SPAM,
                "Test");
        User otherHost = new User();
        otherHost.setId(UUID.randomUUID());
        AccommodationListing listing = new AccommodationListing();
        listing.setId(targetId);
        listing.setHost(otherHost);

        when(listingRepository.findById(targetId)).thenReturn(Optional.of(listing));
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(eq(reporterId),
                eq(ReportTargetType.LISTING), eq(targetId), any()))
                .thenReturn(true);

        assertThatThrownBy(() -> reportService.createReport(reporterId, request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("Ya tienes una denuncia activa para este elemento.");
    }

    @Test
    void createReport_shouldSaveAndPublishEvent_whenValid() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.HOME, targetId, ReportReason.FRAUD,
                "Test");
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setTargetType(ReportTargetType.HOME);
        report.setTargetId(targetId);

        when(homeRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(any(), any(), any(), any()))
                .thenReturn(false);
        when(reportMapper.toEntity(request)).thenReturn(report);
        when(reportRepository.save(report)).thenReturn(report);
        when(reportMapper.toResponse(report)).thenReturn(new ReportResponse(report.getId(), reporterId,
                ReportTargetType.HOME, targetId, ReportReason.FRAUD, "Test", null, null, null, null, null, null));

        ReportResponse response = reportService.createReport(reporterId, request);

        assertThat(response).isNotNull();
        verify(reportRepository).save(report);

        ArgumentCaptor<ReportCreatedEvent> eventCaptor = ArgumentCaptor.forClass(ReportCreatedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());

        ReportCreatedEvent event = eventCaptor.getValue();
        assertThat(event.reportId()).isEqualTo(report.getId());
        assertThat(event.targetType()).isEqualTo(ReportTargetType.HOME);
    }

    @Test
    void createReport_shouldSaveAndPublishEvent_whenListingReportIsValid() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.LISTING, targetId, ReportReason.FRAUD,
                "Anuncio engañoso");
        User otherHost = new User();
        otherHost.setId(UUID.randomUUID());
        AccommodationListing listing = new AccommodationListing();
        listing.setId(targetId);
        listing.setHost(otherHost);

        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setTargetType(ReportTargetType.LISTING);
        report.setTargetId(targetId);

        when(listingRepository.findById(targetId)).thenReturn(Optional.of(listing));
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(any(), any(), any(), any()))
                .thenReturn(false);
        when(reportMapper.toEntity(request)).thenReturn(report);
        when(reportRepository.save(report)).thenReturn(report);
        when(reportMapper.toResponse(report)).thenReturn(new ReportResponse(report.getId(), reporterId,
                ReportTargetType.LISTING, targetId, ReportReason.FRAUD, "Anuncio engañoso", null, null, null, null, null, null));

        ReportResponse response = reportService.createReport(reporterId, request);

        assertThat(response).isNotNull();
        verify(reportRepository).save(report);

        ArgumentCaptor<ReportCreatedEvent> eventCaptor = ArgumentCaptor.forClass(ReportCreatedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());

        ReportCreatedEvent event = eventCaptor.getValue();
        assertThat(event.reportId()).isEqualTo(report.getId());
        assertThat(event.targetType()).isEqualTo(ReportTargetType.LISTING);
    }

    @Test
    void createReport_shouldCheckExpense_whenValid() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.EXPENSE, targetId, ReportReason.FRAUD,
                "Test");
        Report report = new Report();
        report.setId(UUID.randomUUID());

        when(expenseRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(any(), any(), any(), any()))
                .thenReturn(false);
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

    @Test
    void cancelReport_shouldCancelSuccessfully() {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setReporterId(reporterId);
        report.setStatus(ReportStatus.PENDING);

        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        reportService.cancelReport(reporterId, report.getId());

        assertThat(report.getStatus()).isEqualTo(ReportStatus.CANCELLED);
        verify(reportRepository).save(report);
    }

    @Test
    void cancelReport_shouldThrowException_whenNotOwner() {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setReporterId(UUID.randomUUID()); // Different owner

        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> reportService.cancelReport(reporterId, report.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No tienes permiso");
    }

    @Test
    void cancelReport_shouldThrowException_whenNotPending() {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setReporterId(reporterId);
        report.setStatus(ReportStatus.INVESTIGATING);

        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> reportService.cancelReport(reporterId, report.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Solo puedes cancelar denuncias en estado PENDING");
    }
}
