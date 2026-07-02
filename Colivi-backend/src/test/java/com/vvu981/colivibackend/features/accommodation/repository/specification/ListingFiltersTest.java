package com.vvu981.colivibackend.features.accommodation.repository.specification;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@DisplayName("Listing Filters Unit Tests")
class ListingFiltersTest {

    private CityFilter cityFilter;
    private MaxPriceFilter maxPriceFilter;

    @BeforeEach
    void setUp() {
        cityFilter = new CityFilter();
        maxPriceFilter = new MaxPriceFilter();
    }

    @Test
    @DisplayName("CityFilter debe ser aplicable si existe el parametro 'city' no vacio")
    void testCityFilterApplicability() {
        Map<String, String> params = new HashMap<>();
        assertThat(cityFilter.isApplicable(params)).isFalse();

        params.put("city", "");
        assertThat(cityFilter.isApplicable(params)).isFalse();

        params.put("city", "Madrid");
        assertThat(cityFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("CityFilter apply debe generar la condicion like correcta")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testCityFilterApply() {
        Map<String, String> params = Map.of("city", "Madrid");
        Specification<AccommodationListing> spec = cityFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Join join = mock(Join.class);
        Path cityPath = mock(Path.class);
        Expression lowerCity = mock(Expression.class);
        Predicate likePredicate = mock(Predicate.class);

        when(root.join("accommodation")).thenReturn(join);
        when(join.get("city")).thenReturn(cityPath);
        when(cb.lower(any(Expression.class))).thenReturn(lowerCity);
        when(cb.like(any(Expression.class), anyString())).thenReturn(likePredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(likePredicate);
        verify(root, times(1)).join("accommodation");
        verify(cb, times(1)).like(eq(lowerCity), eq("%madrid%"));
    }

    @Test
    @DisplayName("MaxPriceFilter debe ser aplicable si existe el parametro 'maxPrice' no vacio")
    void testMaxPriceFilterApplicability() {
        Map<String, String> params = new HashMap<>();
        assertThat(maxPriceFilter.isApplicable(params)).isFalse();

        params.put("maxPrice", "");
        assertThat(maxPriceFilter.isApplicable(params)).isFalse();

        params.put("maxPrice", "500");
        assertThat(maxPriceFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("MaxPriceFilter apply debe generar la condicion lessThanOrEqualTo correcta")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testMaxPriceFilterApply() {
        Map<String, String> params = Map.of("maxPrice", "750");
        Specification<AccommodationListing> spec = maxPriceFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path pricePath = mock(Path.class);
        Predicate lessThanPredicate = mock(Predicate.class);

        when(root.get("pricePerMonth")).thenReturn(pricePath);
        when(cb.lessThanOrEqualTo(eq(pricePath), any(BigDecimal.class))).thenReturn(lessThanPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(lessThanPredicate);
        verify(root, times(1)).get("pricePerMonth");
        verify(cb, times(1)).lessThanOrEqualTo(eq(pricePath), eq(new BigDecimal("750")));
    }
}
