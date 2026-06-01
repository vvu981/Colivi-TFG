package com.vvu981.colivibackend.features.user.repository;

import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByIdAndDeletedAtIsNull(UUID userId);

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    Optional<User> findByNicknameAndDeletedAtIsNull(String nickname);

    List<User> findAllByDeletedAtIsNull();

    

}