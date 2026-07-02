package com.vvu981.colivibackend.features.accommodation.repository.specification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

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
    @DisplayName("MaxPriceFilter debe ser aplicable si existe el parametro 'maxPrice' no vacio")
    void testMaxPriceFilterApplicability() {
        Map<String, String> params = new HashMap<>();
        assertThat(maxPriceFilter.isApplicable(params)).isFalse();

        params.put("maxPrice", "");
        assertThat(maxPriceFilter.isApplicable(params)).isFalse();

        params.put("maxPrice", "500");
        assertThat(maxPriceFilter.isApplicable(params)).isTrue();
    }
}
