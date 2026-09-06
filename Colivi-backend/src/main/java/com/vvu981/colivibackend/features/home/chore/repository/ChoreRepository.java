package com.vvu981.colivibackend.features.home.chore.repository;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChoreRepository extends JpaRepository<Chore, UUID>, JpaSpecificationExecutor<Chore> {

    Optional<Chore> findByIdAndHomeId(UUID id, UUID homeId);

    List<Chore> findByHomeIdOrderByDueDateAscCreatedAtAsc(UUID homeId);

    List<Chore> findByHomeIdAndSeriesIdAndDueDateGreaterThanEqualAndStatus(
            UUID homeId,
            UUID seriesId,
            LocalDate dueDate,
            ChoreStatus status
    );

    @Query("SELECT c FROM Chore c " +
           "LEFT JOIN FETCH c.assignee " +
           "LEFT JOIN FETCH c.completedBy " +
           "WHERE c.home.id = :homeId " +
           "AND (" +
           "   (c.completedAt IS NOT NULL AND c.completedAt >= :startDateTime AND c.completedAt <= :endDateTime) " +
           "   OR (c.status = 'PENDING' AND c.dueDate >= :startDate AND c.dueDate <= :endDate)" +
           ")")
    List<Chore> findForLeaderboard(
            @Param("homeId") UUID homeId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
