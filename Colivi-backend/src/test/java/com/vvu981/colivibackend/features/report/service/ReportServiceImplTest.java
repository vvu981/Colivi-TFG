package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportCreatedEvent;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportFeedbackResponse;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    void createReport_shouldThrowException_whenTargetUserDoesNotExist() {
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
    void createReport_shouldSaveAndPublishEvent_whenUserReportIsValid() {
        CreateReportRequest request = new CreateReportRequest(ReportTargetType.USER, targetId, ReportReason.HARASSMENT,
                "Acoso en mensajes");
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setTargetType(ReportTargetType.USER);
        report.setTargetId(targetId);
        report.setReason(ReportReason.HARASSMENT);

        when(userRepository.existsById(targetId)).thenReturn(true);
        when(reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(any(), any(), any(), any()))
                .thenReturn(false);
        when(reportMapper.toEntity(request)).thenReturn(report);
        when(reportRepository.save(report)).thenReturn(report);
        when(reportMapper.toResponse(report)).thenReturn(new ReportResponse(report.getId(), reporterId,
                ReportTargetType.USER, targetId, ReportReason.HARASSMENT, "Acoso en mensajes", null, null, null, null, null, null));

        ReportResponse response = reportService.createReport(reporterId, request);

        assertThat(response).isNotNull();
        verify(reportRepository).save(report);

        ArgumentCaptor<ReportCreatedEvent> eventCaptor = ArgumentCaptor.forClass(ReportCreatedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());

        ReportCreatedEvent event = eventCaptor.getValue();
        assertThat(event.reportId()).isEqualTo(report.getId());
        assertThat(event.targetType()).isEqualTo(ReportTargetType.USER);
        assertThat(event.reason()).isEqualTo(ReportReason.HARASSMENT);
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
        report.setReason(ReportReason.FRAUD);

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
        assertThat(event.reason()).isEqualTo(ReportReason.FRAUD);
    }

    @Test
    void getPendingFeedback_shouldReturnListOfFeedbackResponses() {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setReporterId(reporterId);
        report.setStatus(ReportStatus.RESOLVED);
        report.setResolvedAt(LocalDateTime.now());

        ReportFeedbackResponse feedbackResponse = new ReportFeedbackResponse(
                report.getId(), ReportTargetType.LISTING, ReportReason.SPAM, report.getResolvedAt());

        when(reportRepository.findByReporterIdAndStatusAndReporterNotifiedFalse(reporterId, ReportStatus.RESOLVED))
                .thenReturn(List.of(report));
        when(reportMapper.toFeedbackResponse(report)).thenReturn(feedbackResponse);

        List<ReportFeedbackResponse> result = reportService.getPendingFeedback(reporterId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(report.getId());
        verify(reportRepository).findByReporterIdAndStatusAndReporterNotifiedFalse(reporterId, ReportStatus.RESOLVED);
    }

    @Test
    void acknowledgeFeedback_shouldMarkAsNotifiedSuccessfully() {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setReporterId(reporterId);
        report.setStatus(ReportStatus.RESOLVED);
        report.setReporterNotified(false);

        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        reportService.acknowledgeFeedback(reporterId, report.getId());

        assertThat(report.isReporterNotified()).isTrue();
        verify(reportRepository).save(report);
    }

    @Test
    void acknowledgeFeedback_shouldThrowResourceNotFound_whenReportNotFound() {
        UUID randomId = UUID.randomUUID();
        when(reportRepository.findById(randomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.acknowledgeFeedback(reporterId, randomId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Denuncia no encontrada.");
    }

    @Test
    void acknowledgeFeedback_shouldThrowBusinessRuleException_whenUserIsNotReporter() {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setReporterId(UUID.randomUUID()); // Different reporter

        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> reportService.acknowledgeFeedback(reporterId, report.getId()))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("No tienes permiso para actualizar este reporte.");
    }
}
