package com.vvu981.colivibackend.features.home.repository.specification;

import com.vvu981.colivibackend.features.home.domain.HomeExpense;
import com.vvu981.colivibackend.features.home.dto.ExpenseFilterDto;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class HomeExpenseSpecification {

    private HomeExpenseSpecification() {
        // Utility class
    }

    public static Specification<HomeExpense> withFilter(UUID homeId, ExpenseFilterDto filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("home").get("id"), homeId));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (filter != null) {
                if (filter.search() != null && !filter.search().isBlank()) {
                    String pattern = "%" + filter.search().trim().toLowerCase() + "%";
                    predicates.add(cb.like(cb.lower(root.get("description")), pattern));
                }

                if (filter.payerId() != null) {
                    predicates.add(cb.equal(root.get("payer").get("id"), filter.payerId()));
                }

                if (filter.onlyPayments() != null) {
                    predicates.add(cb.equal(root.get("isPayment"), filter.onlyPayments()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
