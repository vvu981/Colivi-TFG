package com.vvu981.colivibackend.features.report.mapper;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.TargetType;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ReportMapperTest {

    private final ReportMapper mapper = Mappers.getMapper(ReportMapper.class);

    @Test
    void toEntity_shouldMapCorrectly() {
        CreateReportRequest request = new CreateReportRequest(TargetType.USER, UUID.randomUUID(), ReportReason.SPAM, "Test");
        Report report = mapper.toEntity(request);
        
        assertThat(report).isNotNull();
        assertThat(report.getTargetType()).isEqualTo(TargetType.USER);
        assertThat(report.getReason()).isEqualTo(ReportReason.SPAM);
        assertThat(report.getDescription()).isEqualTo("Test");
    }

    @Test
    void toEntity_shouldReturnNull_whenNull() {
        assertThat(mapper.toEntity(null)).isNull();
    }

    @Test
    void toResponse_shouldMapCorrectly() {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setTargetType(TargetType.USER);
        report.setReason(ReportReason.SPAM);

        ReportResponse response = mapper.toResponse(report);
        
        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(report.getId());
        assertThat(response.targetType()).isEqualTo(TargetType.USER);
        assertThat(response.reason()).isEqualTo(ReportReason.SPAM);
    }

    @Test
    void toResponse_shouldReturnNull_whenNull() {
        assertThat(mapper.toResponse(null)).isNull();
    }
}
