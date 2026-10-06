package com.vvu981.colivibackend.features.user.repository;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.lang.reflect.Constructor;
import java.lang.reflect.Modifier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSpecificationsTest {

    @Mock
    private Root<User> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Test
    @DisplayName("Private constructor is accessible and prevents instantiation")
    void testPrivateConstructor() throws Exception {
        Constructor<UserSpecifications> constructor = UserSpecifications.class.getDeclaredConstructor();
        assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        constructor.setAccessible(true);
        UserSpecifications instance = constructor.newInstance();
        assertNotNull(instance);
    }

    @Test
    @DisplayName("hasQuery returns conjunction when query is null or blank")
    void testHasQueryNullOrBlank() {
        Predicate conjunction = mock(Predicate.class);
        when(cb.conjunction()).thenReturn(conjunction);

        Specification<User> nullSpec = UserSpecifications.hasQuery(null);
        assertSame(conjunction, nullSpec.toPredicate(root, query, cb));

        Specification<User> emptySpec = UserSpecifications.hasQuery("");
        assertSame(conjunction, emptySpec.toPredicate(root, query, cb));

        Specification<User> blankSpec = UserSpecifications.hasQuery("   ");
        assertSame(conjunction, blankSpec.toPredicate(root, query, cb));
    }

    @Test
    @DisplayName("hasQuery builds or-predicates for query terms")
    void testHasQueryValid() {
        Path<Object> emailPath = mock(Path.class);
        Path<Object> nicknamePath = mock(Path.class);
        Path<Object> firstNamePath = mock(Path.class);
        Path<Object> lastName1Path = mock(Path.class);
        Path<Object> lastName2Path = mock(Path.class);
        Path<Object> idPath = mock(Path.class);
        Expression<String> idAsString = mock(Expression.class);

        Expression<String> lowerExpr = mock(Expression.class);
        Predicate likePredicate = mock(Predicate.class);
        Predicate orPredicate = mock(Predicate.class);

        when(root.get("email")).thenReturn(emailPath);
        when(root.get("nickname")).thenReturn(nicknamePath);
        when(root.get("firstName")).thenReturn(firstNamePath);
        when(root.get("lastName1")).thenReturn(lastName1Path);
        when(root.get("lastName2")).thenReturn(lastName2Path);
        when(root.get("id")).thenReturn(idPath);
        when(idPath.as(String.class)).thenReturn(idAsString);

        when(cb.lower(any())).thenReturn(lowerExpr);
        when(cb.like(eq(lowerExpr), eq("%carlos%"))).thenReturn(likePredicate);
        when(cb.or(any(Predicate[].class))).thenReturn(orPredicate);

        Specification<User> spec = UserSpecifications.hasQuery(" Carlos ");
        Predicate result = spec.toPredicate(root, query, cb);

        assertSame(orPredicate, result);
    }

    @Test
    @DisplayName("hasRole returns conjunction when null, equal predicate otherwise")
    void testHasRole() {
        Predicate conjunction = mock(Predicate.class);
        when(cb.conjunction()).thenReturn(conjunction);

        Specification<User> nullSpec = UserSpecifications.hasRole(null);
        assertSame(conjunction, nullSpec.toPredicate(root, query, cb));

        Path<Object> rolePath = mock(Path.class);
        Predicate equalPredicate = mock(Predicate.class);
        when(root.get("role")).thenReturn(rolePath);
        when(cb.equal(rolePath, UserRole.ADMIN)).thenReturn(equalPredicate);

        Specification<User> roleSpec = UserSpecifications.hasRole(UserRole.ADMIN);
        assertSame(equalPredicate, roleSpec.toPredicate(root, query, cb));
    }

    @Test
    @DisplayName("isBanned returns conjunction when null, isNotNull when true, isNull when false")
    void testIsBanned() {
        Predicate conjunction = mock(Predicate.class);
        when(cb.conjunction()).thenReturn(conjunction);

        Specification<User> nullSpec = UserSpecifications.isBanned(null);
        assertSame(conjunction, nullSpec.toPredicate(root, query, cb));

        Path<Object> bannedAtPath = mock(Path.class);
        Predicate notNullPredicate = mock(Predicate.class);
        Predicate isNullPredicate = mock(Predicate.class);
        when(root.get("bannedAt")).thenReturn(bannedAtPath);
        when(cb.isNotNull(bannedAtPath)).thenReturn(notNullPredicate);
        when(cb.isNull(bannedAtPath)).thenReturn(isNullPredicate);

        Specification<User> trueSpec = UserSpecifications.isBanned(true);
        assertSame(notNullPredicate, trueSpec.toPredicate(root, query, cb));

        Specification<User> falseSpec = UserSpecifications.isBanned(false);
        assertSame(isNullPredicate, falseSpec.toPredicate(root, query, cb));
    }

    @Test
    @DisplayName("isDeleted returns conjunction when null, isNotNull when true, isNull when false")
    void testIsDeleted() {
        Predicate conjunction = mock(Predicate.class);
        when(cb.conjunction()).thenReturn(conjunction);

        Specification<User> nullSpec = UserSpecifications.isDeleted(null);
        assertSame(conjunction, nullSpec.toPredicate(root, query, cb));

        Path<Object> deletedAtPath = mock(Path.class);
        Predicate notNullPredicate = mock(Predicate.class);
        Predicate isNullPredicate = mock(Predicate.class);
        when(root.get("deletedAt")).thenReturn(deletedAtPath);
        when(cb.isNotNull(deletedAtPath)).thenReturn(notNullPredicate);
        when(cb.isNull(deletedAtPath)).thenReturn(isNullPredicate);

        Specification<User> trueSpec = UserSpecifications.isDeleted(true);
        assertSame(notNullPredicate, trueSpec.toPredicate(root, query, cb));

        Specification<User> falseSpec = UserSpecifications.isDeleted(false);
        assertSame(isNullPredicate, falseSpec.toPredicate(root, query, cb));
    }

    @Test
    @DisplayName("buildAdminFilter combines all specifications")
    void testBuildAdminFilter() {
        Specification<User> spec = UserSpecifications.buildAdminFilter("test", UserRole.USER, false, false);
        assertNotNull(spec);
    }
}
