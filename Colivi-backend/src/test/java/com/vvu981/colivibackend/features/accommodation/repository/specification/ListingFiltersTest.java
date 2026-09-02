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
    private TitleFilter titleFilter;
    private MinPriceFilter minPriceFilter;
    private MaxPriceFilter maxPriceFilter;
    private ListingStatusFilter listingStatusFilter;
    private AmenitiesFilter amenitiesFilter;

    @BeforeEach
    void setUp() {
        cityFilter = new CityFilter();
        titleFilter = new TitleFilter();
        minPriceFilter = new MinPriceFilter();
        maxPriceFilter = new MaxPriceFilter();
        listingStatusFilter = new ListingStatusFilter();
        amenitiesFilter = new AmenitiesFilter();
    }

    @Test
    @DisplayName("TitleFilter debe ser aplicable si existe el parametro 'title' no vacio")
    void testTitleFilterApplicability() {
        assertThat(titleFilter.isApplicable(null)).isFalse();

        Map<String, String> params = new HashMap<>();
        assertThat(titleFilter.isApplicable(params)).isFalse();

        params.put("title", null);
        assertThat(titleFilter.isApplicable(params)).isFalse();

        params.put("title", "");
        assertThat(titleFilter.isApplicable(params)).isFalse();

        params.put("title", "Habitación luminosa");
        assertThat(titleFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("TitleFilter apply debe generar la condicion like correcta sobre title e id")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testTitleFilterApply() {
        Map<String, String> params = Map.of("title", "Habitación");
        Specification<AccommodationListing> spec = titleFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path titlePath = mock(Path.class);
        Path idPath = mock(Path.class);
        Expression lowerTitle = mock(Expression.class);
        Expression lowerId = mock(Expression.class);
        Predicate likeTitle = mock(Predicate.class);
        Predicate likeId = mock(Predicate.class);
        Predicate orPredicate = mock(Predicate.class);

        when(root.get("title")).thenReturn(titlePath);
        when(root.get("id")).thenReturn(idPath);
        when(idPath.as(String.class)).thenReturn(idPath);
        when(cb.lower(titlePath)).thenReturn(lowerTitle);
        when(cb.lower(idPath)).thenReturn(lowerId);
        when(cb.like(lowerTitle, "%habitación%")).thenReturn(likeTitle);
        when(cb.like(lowerId, "%habitación%")).thenReturn(likeId);
        when(cb.or(likeTitle, likeId)).thenReturn(orPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(orPredicate);
    }

    @Test
    @DisplayName("IdFilter debe ser aplicable si existe el parametro 'id' no vacio")
    void testIdFilterApplicability() {
        IdFilter idFilter = new IdFilter();
        assertThat(idFilter.isApplicable(null)).isFalse();

        Map<String, String> params = new HashMap<>();
        assertThat(idFilter.isApplicable(params)).isFalse();

        params.put("id", null);
        assertThat(idFilter.isApplicable(params)).isFalse();

        params.put("id", "   ");
        assertThat(idFilter.isApplicable(params)).isFalse();

        params.put("id", "123e4567-e89b-12d3-a456-426614174000");
        assertThat(idFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("IdFilter apply debe generar la condicion like correcta sobre id")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testIdFilterApply() {
        IdFilter idFilter = new IdFilter();
        Map<String, String> params = Map.of("id", "123e4567");
        Specification<AccommodationListing> spec = idFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path idPath = mock(Path.class);
        Expression lowerId = mock(Expression.class);
        Predicate likePredicate = mock(Predicate.class);

        when(root.get("id")).thenReturn(idPath);
        when(idPath.as(String.class)).thenReturn(idPath);
        when(cb.lower(idPath)).thenReturn(lowerId);
        when(cb.like(lowerId, "%123e4567%")).thenReturn(likePredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(likePredicate);
    }

    @Test
    @DisplayName("CityFilter debe ser aplicable si existe el parametro 'city' no vacio")
    void testCityFilterApplicability() {
        assertThat(cityFilter.isApplicable(null)).isFalse();
        
        Map<String, String> params = new HashMap<>();
        assertThat(cityFilter.isApplicable(params)).isFalse();

        params.put("city", null);
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
    @DisplayName("MinPriceFilter debe ser aplicable si existe el parametro 'minPrice' no vacio")
    void testMinPriceFilterApplicability() {
        assertThat(minPriceFilter.isApplicable(null)).isFalse();

        Map<String, String> params = new HashMap<>();
        assertThat(minPriceFilter.isApplicable(params)).isFalse();

        params.put("minPrice", null);
        assertThat(minPriceFilter.isApplicable(params)).isFalse();

        params.put("minPrice", "");
        assertThat(minPriceFilter.isApplicable(params)).isFalse();

        params.put("minPrice", "300");
        assertThat(minPriceFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("MinPriceFilter apply debe generar la condicion greaterThanOrEqualTo correcta")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testMinPriceFilterApply() {
        Map<String, String> params = Map.of("minPrice", "400");
        Specification<AccommodationListing> spec = minPriceFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path pricePath = mock(Path.class);
        Predicate greaterThanPredicate = mock(Predicate.class);

        when(root.get("pricePerMonth")).thenReturn(pricePath);
        when(cb.greaterThanOrEqualTo(eq(pricePath), any(BigDecimal.class))).thenReturn(greaterThanPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(greaterThanPredicate);
        verify(root, times(1)).get("pricePerMonth");
        verify(cb, times(1)).greaterThanOrEqualTo(eq(pricePath), eq(new BigDecimal("400")));
    }

    @Test
    @DisplayName("MinPriceFilter apply con formato invalido lanza IllegalArgumentException")
    void testMinPriceFilterApplyInvalidFormat() {
        Map<String, String> params = Map.of("minPrice", "invalid_number");
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            minPriceFilter.apply(params);
        });
    }

    @Test
    @DisplayName("MaxPriceFilter debe ser aplicable si existe el parametro 'maxPrice' no vacio")
    void testMaxPriceFilterApplicability() {
        assertThat(maxPriceFilter.isApplicable(null)).isFalse();
        
        Map<String, String> params = new HashMap<>();
        assertThat(maxPriceFilter.isApplicable(params)).isFalse();

        params.put("maxPrice", null);
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

    @Test
    @DisplayName("RentalTypeFilter debe ser aplicable si existe el parametro 'rentalType' no vacio")
    void testRentalTypeFilterApplicability() {
        RentalTypeFilter rentalTypeFilter = new RentalTypeFilter();
        assertThat(rentalTypeFilter.isApplicable(null)).isFalse();
        
        Map<String, String> params = new HashMap<>();
        assertThat(rentalTypeFilter.isApplicable(params)).isFalse();

        params.put("rentalType", null);
        assertThat(rentalTypeFilter.isApplicable(params)).isFalse();

        params.put("rentalType", "");
        assertThat(rentalTypeFilter.isApplicable(params)).isFalse();

        params.put("rentalType", "ROOM");
        assertThat(rentalTypeFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("RentalTypeFilter apply debe generar la condicion equal correcta para enum valido")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testRentalTypeFilterApplyValid() {
        RentalTypeFilter rentalTypeFilter = new RentalTypeFilter();
        Map<String, String> params = Map.of("rentalType", "ENTIRE_PLACE");
        Specification<AccommodationListing> spec = rentalTypeFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path path = mock(Path.class);
        Predicate equalPredicate = mock(Predicate.class);

        when(root.get("rentalType")).thenReturn(path);
        when(cb.equal(eq(path), any(com.vvu981.colivibackend.features.accommodation.domain.RentalType.class))).thenReturn(equalPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(equalPredicate);
        verify(root, times(1)).get("rentalType");
        verify(cb, times(1)).equal(eq(path), eq(com.vvu981.colivibackend.features.accommodation.domain.RentalType.ENTIRE_PLACE));
    }

    @Test
    @DisplayName("RentalTypeFilter apply debe devolver conjunction (noop) si enum es invalido")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testRentalTypeFilterApplyInvalid() {
        RentalTypeFilter rentalTypeFilter = new RentalTypeFilter();
        Map<String, String> params = Map.of("rentalType", "INVALID_ENUM");
        Specification<AccommodationListing> spec = rentalTypeFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Predicate conjunctionPredicate = mock(Predicate.class);

        when(cb.conjunction()).thenReturn(conjunctionPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(conjunctionPredicate);
        verify(cb, times(1)).conjunction();
    }

    @Test
    @DisplayName("ListingStatusFilter debe ser aplicable si existe el parametro 'status' no vacio")
    void testListingStatusFilterApplicability() {
        assertThat(listingStatusFilter.isApplicable(new HashMap<>())).isFalse();
        
        Map<String, String> params = new HashMap<>();
        params.put("status", "");
        assertThat(listingStatusFilter.isApplicable(params)).isFalse();

        params.put("status", "AVAILABLE");
        assertThat(listingStatusFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("ListingStatusFilter apply debe generar equal para status valido")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testListingStatusFilterApplyValid() {
        Map<String, String> params = Map.of("status", "AVAILABLE");
        Specification<AccommodationListing> spec = listingStatusFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path path = mock(Path.class);
        Predicate equalPredicate = mock(Predicate.class);

        when(root.get("status")).thenReturn(path);
        when(cb.equal(eq(path), any(com.vvu981.colivibackend.features.accommodation.domain.ListingStatus.class))).thenReturn(equalPredicate);

        Predicate result = spec.toPredicate(root, query, cb);
        assertThat(result).isEqualTo(equalPredicate);
        verify(cb).equal(eq(path), eq(com.vvu981.colivibackend.features.accommodation.domain.ListingStatus.AVAILABLE));
    }

    @Test
    @DisplayName("ListingStatusFilter apply debe devolver conjunction si enum es invalido")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testListingStatusFilterApplyInvalid() {
        Map<String, String> params = Map.of("status", "INVALID_ENUM");
        Specification<AccommodationListing> spec = listingStatusFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Predicate conjunctionPredicate = mock(Predicate.class);

        when(cb.conjunction()).thenReturn(conjunctionPredicate);

        Predicate result = spec.toPredicate(root, query, cb);
        assertThat(result).isEqualTo(conjunctionPredicate);
    }

    @Test
    @DisplayName("AmenitiesFilter debe ser aplicable si existe el parametro 'amenities' no vacio")
    void testAmenitiesFilterApplicability() {
        assertThat(amenitiesFilter.isApplicable(null)).isFalse();

        Map<String, String> params = new HashMap<>();
        assertThat(amenitiesFilter.isApplicable(params)).isFalse();

        params.put("amenities", null);
        assertThat(amenitiesFilter.isApplicable(params)).isFalse();

        params.put("amenities", "");
        assertThat(amenitiesFilter.isApplicable(params)).isFalse();

        params.put("amenities", "   ");
        assertThat(amenitiesFilter.isApplicable(params)).isFalse();

        params.put("amenities", "WIFI,BALCONY");
        assertThat(amenitiesFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("AmenitiesFilter apply debe generar isMember para cada amenity valida y combinarlas con and")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testAmenitiesFilterApplyValid() {
        Map<String, String> params = Map.of("amenities", "WIFI,BALCONY");
        Specification<AccommodationListing> spec = amenitiesFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Join join = mock(Join.class);
        Path amenitiesPath = mock(Path.class);
        Predicate wifiPredicate = mock(Predicate.class);
        Predicate balconyPredicate = mock(Predicate.class);
        Predicate andPredicate = mock(Predicate.class);

        when(root.join("accommodation")).thenReturn(join);
        when(join.get("amenities")).thenReturn(amenitiesPath);
        when(cb.isMember(eq(com.vvu981.colivibackend.features.accommodation.domain.AmenityType.WIFI), eq(amenitiesPath)))
                .thenReturn(wifiPredicate);
        when(cb.isMember(eq(com.vvu981.colivibackend.features.accommodation.domain.AmenityType.BALCONY), eq(amenitiesPath)))
                .thenReturn(balconyPredicate);
        when(cb.and(any(Predicate[].class))).thenReturn(andPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(andPredicate);
        verify(root, times(1)).join("accommodation");
        verify(cb, times(1)).isMember(eq(com.vvu981.colivibackend.features.accommodation.domain.AmenityType.WIFI), eq(amenitiesPath));
        verify(cb, times(1)).isMember(eq(com.vvu981.colivibackend.features.accommodation.domain.AmenityType.BALCONY), eq(amenitiesPath));
        verify(cb, times(1)).and(any(Predicate[].class));
    }

    @Test
    @DisplayName("AmenitiesFilter apply lanza IllegalArgumentException si hay amenities validas")
    void testAmenitiesFilterApplyInvalid() {
        Map<String, String> params = Map.of("amenities", "INVALID_AMENITY_1,INVALID_AMENITY_2");
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            amenitiesFilter.apply(params);
        });
    }

    @Test
    @DisplayName("AmenitiesFilter apply devuelve conjunction cuando la lista esta vacia despues de split")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testAmenitiesFilterApplyEmptyAfterSplit() {
        Map<String, String> params = Map.of("amenities", ", , ");
        Specification<AccommodationListing> spec = amenitiesFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Predicate conjunctionPredicate = mock(Predicate.class);

        when(cb.conjunction()).thenReturn(conjunctionPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(conjunctionPredicate);
        verify(cb, times(1)).conjunction();
    }

    @Test
    @DisplayName("HostIdFilter debe ser aplicable si existe el parametro 'hostId' no vacio")
    void testHostIdFilterApplicability() {
        HostIdFilter hostIdFilter = new HostIdFilter();
        assertThat(hostIdFilter.isApplicable(null)).isFalse();

        Map<String, String> params = new HashMap<>();
        assertThat(hostIdFilter.isApplicable(params)).isFalse();

        params.put("hostId", null);
        assertThat(hostIdFilter.isApplicable(params)).isFalse();

        params.put("hostId", "   ");
        assertThat(hostIdFilter.isApplicable(params)).isFalse();

        params.put("hostId", java.util.UUID.randomUUID().toString());
        assertThat(hostIdFilter.isApplicable(params)).isTrue();
    }

    @Test
    @DisplayName("HostIdFilter apply debe generar la condicion equal correcta para UUID valido")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testHostIdFilterApplyValid() {
        HostIdFilter hostIdFilter = new HostIdFilter();
        java.util.UUID hostId = java.util.UUID.randomUUID();
        Map<String, String> params = Map.of("hostId", hostId.toString());
        Specification<AccommodationListing> spec = hostIdFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path hostPath = mock(Path.class);
        Path idPath = mock(Path.class);
        Predicate equalPredicate = mock(Predicate.class);

        when(root.get("host")).thenReturn(hostPath);
        when(hostPath.get("id")).thenReturn(idPath);
        when(cb.equal(idPath, hostId)).thenReturn(equalPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(equalPredicate);
        verify(cb, times(1)).equal(idPath, hostId);
    }

    @Test
    @DisplayName("HostIdFilter apply debe devolver disjunction si UUID es invalido")
    @SuppressWarnings({ "rawtypes", "unchecked" })
    void testHostIdFilterApplyInvalidUuid() {
        HostIdFilter hostIdFilter = new HostIdFilter();
        Map<String, String> params = Map.of("hostId", "not-a-valid-uuid");
        Specification<AccommodationListing> spec = hostIdFilter.apply(params);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Predicate disjunctionPredicate = mock(Predicate.class);

        when(cb.disjunction()).thenReturn(disjunctionPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(disjunctionPredicate);
        verify(cb, times(1)).disjunction();
    }
}
