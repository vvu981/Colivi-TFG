package com.vvu981.colivibackend.features.home.chore.repository;

import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChoreSeriesRepository extends JpaRepository<ChoreSeries, UUID> {

    Optional<ChoreSeries> findByIdAndHomeId(UUID id, UUID homeId);

    List<ChoreSeries> findByHomeId(UUID homeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ChoreSeries s WHERE s.id = :id")
    Optional<ChoreSeries> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT DISTINCT s FROM ChoreSeries s JOIN s.participantOrder p WHERE s.home.id = :homeId AND p = :userId")
    List<ChoreSeries> findByHomeIdAndParticipantUserIdForUpdate(@Param("homeId") UUID homeId, @Param("userId") UUID userId);

    @Query("SELECT DISTINCT s FROM ChoreSeries s JOIN s.participantOrder p WHERE s.home.id = :homeId AND p = :userId")
    List<ChoreSeries> findByHomeIdAndParticipantUserId(@Param("homeId") UUID homeId, @Param("userId") UUID userId);
}
