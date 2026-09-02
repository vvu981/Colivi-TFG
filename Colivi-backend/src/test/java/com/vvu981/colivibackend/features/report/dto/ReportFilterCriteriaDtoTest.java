package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ReportFilterCriteriaDtoTest {

    @Test
    @DisplayName("Debe validar rangos de fechas correctamente")
    void testDateRangeValidation() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        LocalDate yesterday = today.minusDays(1);

        ReportFilterCriteriaDto validDto = new ReportFilterCriteriaDto(
                UUID.randomUUID(), ReportStatus.PENDING, ReportTargetType.USER, UUID.randomUUID(), UUID.randomUUID(),
                ReportReason.SPAM, yesterday, tomorrow, "query-test"
        );
        assertTrue(validDto.isValidDateRange());
        assertEquals(ReportStatus.PENDING, validDto.status());
        assertEquals(ReportTargetType.USER, validDto.targetType());
        assertEquals(ReportReason.SPAM, validDto.reason());
        assertEquals("query-test", validDto.query());

        ReportFilterCriteriaDto equalDates = new ReportFilterCriteriaDto(
                null, null, null, null, null, null, today, today, null
        );
        assertTrue(equalDates.isValidDateRange());

        ReportFilterCriteriaDto invalidDto = new ReportFilterCriteriaDto(
                null, null, null, null, null, null, tomorrow, yesterday, null
        );
        assertFalse(invalidDto.isValidDateRange());

        ReportFilterCriteriaDto onlyFrom = new ReportFilterCriteriaDto(
                null, null, null, null, null, null, today, null, null
        );
        assertTrue(onlyFrom.isValidDateRange());

        ReportFilterCriteriaDto onlyTo = new ReportFilterCriteriaDto(
                null, null, null, null, null, null, null, today, null
        );
        assertTrue(onlyTo.isValidDateRange());

        ReportFilterCriteriaDto nullDates = new ReportFilterCriteriaDto(
                null, null, null, null, null, null, null, null, null
        );
        assertTrue(nullDates.isValidDateRange());
    }
}
