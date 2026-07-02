package com.vvu981.colivibackend.features.accommodation.repository.specification;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@DisplayName("ListingSpecificationBuilder Unit Tests")
class ListingSpecificationBuilderTest {

    @Test
    @DisplayName("debe construir la especificacion base y evaluar filtros aplicables")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void shouldBuildSpecificationWithApplicableFilters() {
        ListingFilter filter1 = mock(ListingFilter.class);
        ListingFilter filter2 = mock(ListingFilter.class);
        
        Map<String, String> params = new HashMap<>();
        params.put("param1", "val1");

        Predicate spec1Predicate = mock(Predicate.class);
        Specification<AccommodationListing> spec1 = new Specification<AccommodationListing>() {
            @Override
            public Predicate toPredicate(Root<AccommodationListing> r, CriteriaQuery<?> q, CriteriaBuilder c) {
                return spec1Predicate;
            }
        };

        when(filter1.isApplicable(params)).thenReturn(true);
        when(filter1.apply(params)).thenReturn(spec1);

        when(filter2.isApplicable(params)).thenReturn(false);

        ListingSpecificationBuilder builder = new ListingSpecificationBuilder(List.of(filter1, filter2));
        Specification<AccommodationListing> finalSpec = builder.buildSpecification(params);

        assertThat(finalSpec).isNotNull();
        verify(filter1, times(1)).isApplicable(params);
        verify(filter1, times(1)).apply(params);
        verify(filter2, times(1)).isApplicable(params);
        verify(filter2, never()).apply(params);

        // Execute base spec lambda to cover its execution block
        Root<AccommodationListing> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        Path<Object> statusPath = mock(Path.class);
        Path<Object> deletedPath = mock(Path.class);
        Predicate equalPredicate = mock(Predicate.class);
        Predicate nullPredicate = mock(Predicate.class);
        Predicate andPredicate = mock(Predicate.class);
        Predicate combinedPredicate = mock(Predicate.class);

        // Custom default answer to intercept all CriteriaBuilder calls robustly
        CriteriaBuilder cb = mock(CriteriaBuilder.class, invocation -> {
            String name = invocation.getMethod().getName();
            Object[] args = invocation.getArguments();
            if (name.equals("equal")) {
                return equalPredicate;
            }
            if (name.equals("isNull")) {
                return nullPredicate;
            }
            if (name.equals("and")) {
                // Try varargs array first
                if (args.length == 1 && args[0] instanceof Predicate[]) {
                    Predicate[] varargs = (Predicate[]) args[0];
                    if (varargs.length == 2 && varargs[0] == equalPredicate && varargs[1] == nullPredicate) {
                        return andPredicate;
                    }
                }
                // Try two argument overload
                if (args.length == 2) {
                    if (args[0] == equalPredicate && args[1] == nullPredicate) {
                        return andPredicate;
                    }
                    if (args[0] == andPredicate && args[1] == spec1Predicate) {
                        return combinedPredicate;
                    }
                }
                return combinedPredicate;
            }
            return null;
        });

        when(root.get("status")).thenReturn(statusPath);
        when(root.get("deletedAt")).thenReturn(deletedPath);

        Predicate result = finalSpec.toPredicate(root, query, cb);
        assertThat(result).isEqualTo(combinedPredicate);
    }
}
