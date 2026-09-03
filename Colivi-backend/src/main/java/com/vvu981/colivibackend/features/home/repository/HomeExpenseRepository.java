package com.vvu981.colivibackend.features.home.repository;

import com.vvu981.colivibackend.features.home.domain.HomeExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HomeExpenseRepository extends JpaRepository<HomeExpense, UUID>, JpaSpecificationExecutor<HomeExpense> {

    @EntityGraph(attributePaths = {"payer", "participants.user"})
    List<HomeExpense> findByHomeIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID homeId);

    @EntityGraph(attributePaths = {"payer", "participants.user"})
    Optional<HomeExpense> findByIdAndDeletedAtIsNull(UUID id);

    @Override
    @EntityGraph(attributePaths = {"payer", "participants.user"})
    Page<HomeExpense> findAll(Specification<HomeExpense> spec, Pageable pageable);
}
