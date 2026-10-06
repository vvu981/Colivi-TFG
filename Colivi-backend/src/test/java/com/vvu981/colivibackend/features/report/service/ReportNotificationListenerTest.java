package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.domain.event.ReportCreatedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class ReportNotificationListenerTest {

    private ReportNotificationListener listener;

    @BeforeEach
    void setUp() {
        listener = new ReportNotificationListener();
    }

    @Test
    void handleReportCreated_shouldHandleFraudReasonGracefully() {
        ReportCreatedEvent event = new ReportCreatedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                ReportTargetType.LISTING,
                UUID.randomUUID(),
                ReportReason.FRAUD
        );

        assertDoesNotThrow(() -> listener.handleReportCreated(event));
    }

    @Test
    void handleReportCreated_shouldHandleHarassmentReasonGracefully() {
        ReportCreatedEvent event = new ReportCreatedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                ReportTargetType.USER,
                UUID.randomUUID(),
                ReportReason.HARASSMENT
        );

        assertDoesNotThrow(() -> listener.handleReportCreated(event));
    }

    @Test
    void handleReportCreated_shouldHandleRegularReasonGracefully() {
        ReportCreatedEvent event = new ReportCreatedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                ReportTargetType.LISTING,
                UUID.randomUUID(),
                ReportReason.SPAM
        );

        assertDoesNotThrow(() -> listener.handleReportCreated(event));
    }
}
