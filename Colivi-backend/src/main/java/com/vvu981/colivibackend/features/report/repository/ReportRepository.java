package com.vvu981.colivibackend.features.report.repository;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID>, JpaSpecificationExecutor<Report> {

    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
            UUID reporterId, ReportTargetType targetType, UUID targetId,
            List<ReportStatus> statuses);

    Page<Report> findByReporterId(UUID reporterId, Pageable pageable);

    @Query("SELECT new com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO(r.targetId, r.targetType, COUNT(r)) "
            +
            "FROM Report r " +
            "WHERE (:targetType IS NULL OR r.targetType = :targetType) " +
            "GROUP BY r.targetId, r.targetType " +
            "ORDER BY COUNT(r) DESC")
    Page<ReportTargetCountDTO> findMostReportedTargets(@Param("targetType") ReportTargetType targetType,
            Pageable pageable);
}
