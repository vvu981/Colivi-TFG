package com.vvu981.colivibackend.features.home.repository.specification;

import com.vvu981.colivibackend.features.home.domain.HomeExpense;
import com.vvu981.colivibackend.features.home.dto.ExpenseFilterDto;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HomeExpenseSpecificationTest {

    @Mock
    private Root<HomeExpense> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Mock
    private Path<Object> pathHome;

    @Mock
    private Path<Object> pathHomeId;

    @Mock
    private Path<Object> pathDeletedAt;

    @Mock
    private Path<String> pathDescription;

    @Mock
    private Path<Object> pathPayer;

    @Mock
    private Path<Object> pathPayerId;

    @Mock
    private Path<Boolean> pathIsPayment;

    @Mock
    private Expression<String> lowerDescription;

    @Mock
    private Predicate predicate;

    private UUID homeId;

    @BeforeEach
    void setUp() {
        homeId = UUID.randomUUID();
        when(root.get("home")).thenReturn(pathHome);
        when(pathHome.get("id")).thenReturn(pathHomeId);
        when(root.get("deletedAt")).thenReturn(pathDeletedAt);
        when(cb.equal(pathHomeId, homeId)).thenReturn(predicate);
        when(cb.isNull(pathDeletedAt)).thenReturn(predicate);
        when(cb.and(any(Predicate[].class))).thenReturn(predicate);
    }

    @Test
    void testPrivateConstructor() throws Exception {
        var constructor = HomeExpenseSpecification.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        var instance = constructor.newInstance();
        assertNotNull(instance);
    }

    @Test
    void withFilter_NullFilter() {
        Specification<HomeExpense> spec = HomeExpenseSpecification.withFilter(homeId, null);
        Predicate result = spec.toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb, times(1)).equal(pathHomeId, homeId);
        verify(cb, times(1)).isNull(pathDeletedAt);
        verify(cb, never()).like(any(), anyString());
    }

    @Test
    void withFilter_AllFiltersActive() {
        UUID payerId = UUID.randomUUID();
        ExpenseFilterDto filter = ExpenseFilterDto.of("compra", payerId, true);

        when(root.<String>get("description")).thenReturn(pathDescription);
        when(cb.lower(pathDescription)).thenReturn(lowerDescription);
        when(cb.like(eq(lowerDescription), eq("%compra%"))).thenReturn(predicate);

        when(root.get("payer")).thenReturn(pathPayer);
        when(pathPayer.get("id")).thenReturn(pathPayerId);
        when(cb.equal(pathPayerId, payerId)).thenReturn(predicate);

        when(root.<Boolean>get("isPayment")).thenReturn(pathIsPayment);
        when(cb.equal(pathIsPayment, true)).thenReturn(predicate);

        Specification<HomeExpense> spec = HomeExpenseSpecification.withFilter(homeId, filter);
        Predicate result = spec.toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb).like(lowerDescription, "%compra%");
        verify(cb).equal(pathPayerId, payerId);
        verify(cb).equal(pathIsPayment, true);
    }

    @Test
    void withFilter_BlankSearchAndFalsePayments() {
        ExpenseFilterDto filter = ExpenseFilterDto.of("   ", null, false);

        when(root.<Boolean>get("isPayment")).thenReturn(pathIsPayment);
        when(cb.equal(pathIsPayment, false)).thenReturn(predicate);

        Specification<HomeExpense> spec = HomeExpenseSpecification.withFilter(homeId, filter);
        Predicate result = spec.toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb, never()).like(any(), anyString());
        verify(cb).equal(pathIsPayment, false);
    }
}
