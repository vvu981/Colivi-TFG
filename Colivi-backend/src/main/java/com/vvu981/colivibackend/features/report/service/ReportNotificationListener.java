package com.vvu981.colivibackend.features.report.service;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.event.ReportCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReportNotificationListener {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleReportCreated(ReportCreatedEvent event) {
        if (event.reason() == ReportReason.FRAUD || event.reason() == ReportReason.HARASSMENT) {
            log.warn("CRITICAL MODERATION ALERT: High priority report created! ReportId={}, Reason={}, TargetType={}, TargetId={}",
                    event.reportId(), event.reason(), event.targetType(), event.targetId());
        } else {
            log.info("Report created: ReportId={}, Reason={}, TargetType={}, TargetId={}",
                    event.reportId(), event.reason(), event.targetType(), event.targetId());
        }
    }
}
