package com.vvu981.colivibackend.features.report.repository;

import com.vvu981.colivibackend.features.report.domain.Report;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID>, JpaSpecificationExecutor<Report> {

        boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
                        UUID reporterId, ReportTargetType targetType, UUID targetId,
                        List<ReportStatus> statuses);

        List<Report> findByReporterIdAndStatusAndReporterNotifiedFalse(UUID reporterId, ReportStatus status);

        @Query(value = "SELECT new com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO("
                        + "r.targetId, r.targetType, "
                        + "SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END), "
                        + "COUNT(r)) "
                        + "FROM Report r "
                        + "WHERE r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.LISTING "
                        + "AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing l WHERE l.id = r.targetId AND l.bannedAt IS NULL AND l.deletedAt IS NULL) "
                        + "GROUP BY r.targetId, r.targetType "
                        + "HAVING SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END) > 0 "
                        + "ORDER BY SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END) DESC, COUNT(r) DESC",
               countQuery = "SELECT COUNT(DISTINCT r.targetId) FROM Report r "
                                + "WHERE r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.LISTING "
                                + "AND r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) "
                                + "AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing l WHERE l.id = r.targetId AND l.bannedAt IS NULL AND l.deletedAt IS NULL)")
        Page<ReportTargetCountDTO> findMostReportedListingsUnbanned(Pageable pageable);

        @Query(value = "SELECT new com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO("
                        + "r.targetId, r.targetType, "
                        + "SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END), "
                        + "COUNT(r)) "
                        + "FROM Report r "
                        + "WHERE r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.USER "
                        + "AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.user.domain.User u WHERE u.id = r.targetId AND u.bannedAt IS NULL AND u.deletedAt IS NULL) "
                        + "GROUP BY r.targetId, r.targetType "
                        + "HAVING SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END) > 0 "
                        + "ORDER BY SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END) DESC, COUNT(r) DESC",
               countQuery = "SELECT COUNT(DISTINCT r.targetId) FROM Report r "
                                + "WHERE r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.USER "
                                + "AND r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) "
                                + "AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.user.domain.User u WHERE u.id = r.targetId AND u.bannedAt IS NULL AND u.deletedAt IS NULL)")
        Page<ReportTargetCountDTO> findMostReportedUsersUnbanned(Pageable pageable);

        @Query(value = "SELECT new com.vvu981.colivibackend.features.report.dto.ReportTargetCountDTO("
                        + "r.targetId, r.targetType, "
                        + "SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END), "
                        + "COUNT(r)) "
                        + "FROM Report r "
                        + "WHERE (r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.LISTING AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing l WHERE l.id = r.targetId AND l.bannedAt IS NULL AND l.deletedAt IS NULL)) "
                        + "   OR (r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.USER AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.user.domain.User u WHERE u.id = r.targetId AND u.bannedAt IS NULL AND u.deletedAt IS NULL)) "
                        + "GROUP BY r.targetId, r.targetType "
                        + "HAVING SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END) > 0 "
                        + "ORDER BY SUM(CASE WHEN r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING) THEN 1L ELSE 0L END) DESC, COUNT(r) DESC",
               countQuery = "SELECT COUNT(DISTINCT r.targetId) FROM Report r "
                                + "WHERE ((r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.LISTING AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing l WHERE l.id = r.targetId AND l.bannedAt IS NULL AND l.deletedAt IS NULL)) "
                                + "   OR (r.targetType = com.vvu981.colivibackend.features.report.domain.ReportTargetType.USER AND EXISTS (SELECT 1 FROM com.vvu981.colivibackend.features.user.domain.User u WHERE u.id = r.targetId AND u.bannedAt IS NULL AND u.deletedAt IS NULL))) "
                                + "AND r.status IN (com.vvu981.colivibackend.features.report.domain.ReportStatus.PENDING, com.vvu981.colivibackend.features.report.domain.ReportStatus.INVESTIGATING)")
        Page<ReportTargetCountDTO> findAllMostReportedUnbanned(Pageable pageable);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("UPDATE Report r SET r.status = :newStatus, r.adminNotes = :adminNotes, r.resolverId = :resolverId, r.resolvedAt = :resolvedAt, r.updatedAt = :updatedAt "
                        + "WHERE r.targetId = :targetId AND r.status IN :currentStatuses")
        int bulkUpdateStatusByTargetId(
                        @Param("targetId") UUID targetId,
                        @Param("newStatus") ReportStatus newStatus,
                        @Param("currentStatuses") Collection<ReportStatus> currentStatuses,
                        @Param("adminNotes") String adminNotes,
                        @Param("resolverId") UUID resolverId,
                        @Param("resolvedAt") LocalDateTime resolvedAt,
                        @Param("updatedAt") LocalDateTime updatedAt);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("UPDATE Report r SET r.status = :newStatus, r.adminNotes = :adminNotes, r.resolverId = :resolverId, r.resolvedAt = :resolvedAt, r.updatedAt = :updatedAt "
                        + "WHERE r.id IN :ids")
        int bulkUpdateStatusByIds(
                        @Param("ids") Collection<UUID> ids,
                        @Param("newStatus") ReportStatus newStatus,
                        @Param("adminNotes") String adminNotes,
                        @Param("resolverId") UUID resolverId,
                        @Param("resolvedAt") LocalDateTime resolvedAt,
                        @Param("updatedAt") LocalDateTime updatedAt);
}
