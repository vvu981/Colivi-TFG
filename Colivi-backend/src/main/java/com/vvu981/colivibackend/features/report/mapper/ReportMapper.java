package com.vvu981.colivibackend.features.report.mapper;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.dto.CreateReportRequest;
import com.vvu981.colivibackend.features.report.dto.ReportResponse;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ReportMapper {

    Report toEntity(CreateReportRequest request);

    ReportResponse toResponse(Report entity);
}
