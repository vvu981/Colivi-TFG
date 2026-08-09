package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.TargetType;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ReportTargetCountDTOTest {

    @Test
    void record_shouldWork() {
        UUID id = UUID.randomUUID();
        ReportTargetCountDTO dto = new ReportTargetCountDTO(id, TargetType.USER, 5L);

        assertThat(dto.targetId()).isEqualTo(id);
        assertThat(dto.targetType()).isEqualTo(TargetType.USER);
        assertThat(dto.reportCount()).isEqualTo(5L);
    }
}
