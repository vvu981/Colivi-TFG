package com.vvu981.colivibackend.features.accommodation.repository.specification;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@DisplayName("ListingSpecificationBuilder Unit Tests")
class ListingSpecificationBuilderTest {

    @Test
    @DisplayName("debe construir la especificacion base y evaluar filtros aplicables")
    @SuppressWarnings("unchecked")
    void shouldBuildSpecificationWithApplicableFilters() {
        ListingFilter filter1 = mock(ListingFilter.class);
        ListingFilter filter2 = mock(ListingFilter.class);
        
        Map<String, String> params = new HashMap<>();
        params.put("param1", "val1");

        when(filter1.isApplicable(params)).thenReturn(true);
        Specification<AccommodationListing> spec1 = mock(Specification.class);
        when(filter1.apply(params)).thenReturn(spec1);

        when(filter2.isApplicable(params)).thenReturn(false);

        ListingSpecificationBuilder builder = new ListingSpecificationBuilder(List.of(filter1, filter2));
        Specification<AccommodationListing> finalSpec = builder.buildSpecification(params);

        assertThat(finalSpec).isNotNull();
        verify(filter1, times(1)).isApplicable(params);
        verify(filter1, times(1)).apply(params);
        verify(filter2, times(1)).isApplicable(params);
        verify(filter2, never()).apply(params);
    }
}
