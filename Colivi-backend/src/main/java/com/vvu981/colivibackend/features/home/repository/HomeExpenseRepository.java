package com.vvu981.colivibackend.features.home.repository;

import com.vvu981.colivibackend.features.home.domain.HomeExpense;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HomeExpenseRepository extends JpaRepository<HomeExpense, UUID> {

    @EntityGraph(attributePaths = {"payer", "participants.user"})
    List<HomeExpense> findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID homeId);

    @EntityGraph(attributePaths = {"payer", "participants.user"})
    Optional<HomeExpense> findByIdAndDeletedAtIsNull(UUID id);
}
