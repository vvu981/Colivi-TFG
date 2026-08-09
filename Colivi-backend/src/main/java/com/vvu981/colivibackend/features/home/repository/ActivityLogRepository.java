package com.vvu981.colivibackend.features.home.repository;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    
    Page<ActivityLog> findByHomeIdAndCreatedAtBetweenOrderByCreatedAtDesc(UUID homeId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, Pageable pageable);
    
    Page<ActivityLog> findByHomeIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(UUID homeId, java.time.LocalDateTime startDate, Pageable pageable);

    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.home.id = :homeId")
    void deleteByHomeId(@Param("homeId") UUID homeId);

    @Modifying
    @Query("UPDATE ActivityLog a SET a.actor = null WHERE a.actor.id = :userId")
    void nullifyActorIdByUserId(@Param("userId") UUID userId);
}
