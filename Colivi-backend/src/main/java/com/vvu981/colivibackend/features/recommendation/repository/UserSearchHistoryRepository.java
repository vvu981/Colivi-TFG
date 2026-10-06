package com.vvu981.colivibackend.features.recommendation.repository;

import com.vvu981.colivibackend.features.recommendation.domain.UserSearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

public interface UserSearchHistoryRepository extends JpaRepository<UserSearchHistory, UUID> {
    
    List<UserSearchHistory> findTop3ByUserIdOrderByCreatedAtDesc(UUID userId);
    java.util.Optional<UserSearchHistory> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("""
        SELECT CASE WHEN COUNT(h) > 0 THEN true ELSE false END 
        FROM UserSearchHistory h 
        WHERE h.userId = :userId 
        AND h.createdAt >= :since 
        AND (h.city = :city OR (h.city IS NULL AND CAST(:city AS string) IS NULL))
        AND (h.maxPrice = :maxPrice OR (h.maxPrice IS NULL AND CAST(:maxPrice AS big_decimal) IS NULL))
        AND (h.accommodationType = :accommodationType OR (h.accommodationType IS NULL AND CAST(:accommodationType AS string) IS NULL))
    """)
    boolean existsRecentSearch(
        @Param("userId") UUID userId,
        @Param("city") String city,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("accommodationType") String accommodationType,
        @Param("since") LocalDateTime since
    );
}
