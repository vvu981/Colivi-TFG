package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ReportTargetCountDTOTest {

    @Test
    void record_shouldWork() {
        UUID id = UUID.randomUUID();
        ReportTargetCountDTO dto = new ReportTargetCountDTO(id, ReportTargetType.USER, 3L, 5L);

        assertThat(dto.targetId()).isEqualTo(id);
        assertThat(dto.targetType()).isEqualTo(ReportTargetType.USER);
        assertThat(dto.pendingCount()).isEqualTo(3L);
        assertThat(dto.totalCount()).isEqualTo(5L);
        assertThat(dto.reportCount()).isEqualTo(3L);
    }
}
