package com.vvu981.colivibackend.features.user.repository;

import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByNickname(String nickname);

    @Modifying
    @Query("UPDATE User u SET u.role = 'ADMIN' WHERE u.id = :targetUserId")
    void setAdmin(@Param("targetUserId") UUID targetUserId);

    @Query(nativeQuery = true, value = "SELECT * FROM \"user\" WHERE reactivation_token = :token")
    Optional<User> findByReactivationToken(@Param("token") String token);

    @Query(nativeQuery = true, value = "SELECT * FROM \"user\" WHERE LOWER(email) = LOWER(:email)")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);
}
