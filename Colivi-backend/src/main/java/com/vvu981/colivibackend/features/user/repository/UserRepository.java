package com.vvu981.colivibackend.features.user.repository;

import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByIdAndDeletedAtIsNull(UUID id);
    Optional<User> findByEmailAndDeletedAtIsNull(String email);
    Optional<User> findByNicknameAndDeletedAtIsNull(String nickname);
    List<User> findAllByDeletedAtIsNull();

    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);

    default Optional<User> findActiveById(UUID id) {
        return findByIdAndDeletedAtIsNull(id);
    }

    default Optional<User> findActiveByEmail(String email) {
        return findByEmailAndDeletedAtIsNull(email);
    }

    default Optional<User> findActiveByNickname(String nickname) {
        return findByNicknameAndDeletedAtIsNull(nickname);
    }

    @Modifying
    @Query("UPDATE User u SET u.role = 'ADMIN' WHERE u.id = :targetUserId")
    void setAdmin(@Param("targetUserId") UUID targetUserId);

    @Query(nativeQuery = true, value = "SELECT * FROM \"user\" WHERE reactivation_token = :token")
    Optional<User> findByReactivationToken(@Param("token") String token);

    @Query(nativeQuery = true, value = "SELECT * FROM \"user\" WHERE LOWER(email) = LOWER(:email)")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);

    @Query(nativeQuery = true, value = "SELECT * FROM \"user\" WHERE password_reset_token = :token")
    Optional<User> findByPasswordResetToken(@Param("token") String token);

    @Modifying
    @Query(nativeQuery = true, value = "UPDATE \"user\" SET reactivation_token = NULL, reactivation_token_expires_at = NULL WHERE reactivation_token_expires_at < CURRENT_TIMESTAMP")
    int clearExpiredReactivationTokens();

    @Modifying
    @Query(nativeQuery = true, value = "UPDATE \"user\" SET password_reset_token = NULL, password_reset_token_expires_at = NULL WHERE password_reset_token_expires_at < CURRENT_TIMESTAMP")
    int clearExpiredPasswordResetTokens();
}
