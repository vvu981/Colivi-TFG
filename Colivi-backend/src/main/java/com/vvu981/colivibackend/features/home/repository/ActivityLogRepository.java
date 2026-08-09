package com.vvu981.colivibackend.features.home.repository;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    
    Page<ActivityLog> findByHomeIdOrderByCreatedAtDesc(UUID homeId, Pageable pageable);
    
    Page<ActivityLog> findByHomeIdAndCreatedAtLessThanEqualOrderByCreatedAtDesc(UUID homeId, java.time.LocalDateTime limitDate, Pageable pageable);
}
