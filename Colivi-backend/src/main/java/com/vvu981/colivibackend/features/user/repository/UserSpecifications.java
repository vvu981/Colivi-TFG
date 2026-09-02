package com.vvu981.colivibackend.features.user.repository;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class UserSpecifications {

    private UserSpecifications() {
        // Utility class
    }

    public static Specification<User> hasQuery(String query) {
        return (root, cq, cb) -> {
            if (query == null || query.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + query.trim().toLowerCase() + "%";
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.like(cb.lower(root.get("email")), pattern));
            predicates.add(cb.like(cb.lower(root.get("nickname")), pattern));
            predicates.add(cb.like(cb.lower(root.get("firstName")), pattern));
            predicates.add(cb.like(cb.lower(root.get("lastName1")), pattern));
            predicates.add(cb.like(cb.lower(root.get("lastName2")), pattern));
            predicates.add(cb.like(cb.lower(root.get("id").as(String.class)), pattern));
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<User> hasRole(UserRole role) {
        return (root, cq, cb) -> {
            if (role == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("role"), role);
        };
    }

    public static Specification<User> isBanned(Boolean banned) {
        return (root, cq, cb) -> {
            if (banned == null) {
                return cb.conjunction();
            }
            if (banned) {
                return cb.isNotNull(root.get("bannedAt"));
            } else {
                return cb.isNull(root.get("bannedAt"));
            }
        };
    }

    public static Specification<User> isDeleted(Boolean deleted) {
        return (root, cq, cb) -> {
            if (deleted == null) {
                return cb.conjunction();
            }
            if (deleted) {
                return cb.isNotNull(root.get("deletedAt"));
            } else {
                return cb.isNull(root.get("deletedAt"));
            }
        };
    }

    public static Specification<User> buildAdminFilter(String query, UserRole role, Boolean banned, Boolean deleted) {
        return Specification.where(hasQuery(query))
                .and(hasRole(role))
                .and(isBanned(banned))
                .and(isDeleted(deleted));
    }
}
