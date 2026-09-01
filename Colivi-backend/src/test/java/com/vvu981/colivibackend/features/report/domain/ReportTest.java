package com.vvu981.colivibackend.features.report.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReportTest {

    private Report report;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        report = new Report();
        adminId = UUID.randomUUID();
    }

    @Test
    void markFeedbackAcknowledged_shouldSetReporterNotifiedToTrue() {
        assertThat(report.isReporterNotified()).isFalse();
        report.markFeedbackAcknowledged();
        assertThat(report.isReporterNotified()).isTrue();
    }

    @Test
    void investigate_shouldChangeStatus() {
        report.investigate(adminId);
        
        assertThat(report.getStatus()).isEqualTo(ReportStatus.INVESTIGATING);
        assertThat(report.getResolverId()).isEqualTo(adminId);
    }

    @Test
    void investigate_shouldThrowException_whenResolved() {
        report.setStatus(ReportStatus.RESOLVED);
        
        assertThatThrownBy(() -> report.investigate(adminId))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void resolve_shouldChangeStatus() {
        report.resolve("Notes", adminId);
        
        assertThat(report.getStatus()).isEqualTo(ReportStatus.RESOLVED);
        assertThat(report.getAdminNotes()).isEqualTo("Notes");
        assertThat(report.getResolverId()).isEqualTo(adminId);
        assertThat(report.getResolvedAt()).isNotNull();
    }

    @Test
    void resolve_shouldThrowException_whenAlreadyResolved() {
        report.setStatus(ReportStatus.RESOLVED);
        
        assertThatThrownBy(() -> report.resolve("Notes", adminId))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void dismiss_shouldChangeStatus() {
        report.dismiss("Notes", adminId);
        
        assertThat(report.getStatus()).isEqualTo(ReportStatus.DISMISSED);
        assertThat(report.getAdminNotes()).isEqualTo("Notes");
        assertThat(report.getResolverId()).isEqualTo(adminId);
        assertThat(report.getResolvedAt()).isNotNull();
    }

    @Test
    void dismiss_shouldThrowException_whenAlreadyDismissed() {
        report.setStatus(ReportStatus.DISMISSED);
        
        assertThatThrownBy(() -> report.dismiss("Notes", adminId))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void dismiss_shouldThrowException_whenAlreadyResolved() {
        report.setStatus(ReportStatus.RESOLVED);

        assertThatThrownBy(() -> report.dismiss("Notes", adminId))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void resolve_shouldThrowException_whenAlreadyDismissed() {
        report.setStatus(ReportStatus.DISMISSED);

        assertThatThrownBy(() -> report.resolve("Notes", adminId))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void investigate_shouldThrowException_whenDismissed() {
        report.setStatus(ReportStatus.DISMISSED);

        assertThatThrownBy(() -> report.investigate(adminId))
                .isInstanceOf(IllegalStateException.class);
    }
}
