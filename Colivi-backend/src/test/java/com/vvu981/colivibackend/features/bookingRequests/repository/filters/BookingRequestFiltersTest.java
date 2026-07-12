package com.vvu981.colivibackend.features.bookingRequests.repository.filters;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;

public class BookingRequestFiltersTest {

    @Test
    void testLandlordIdFilter() {
        LandlordIdFilter filter = new LandlordIdFilter();

        BookingRequestAdminFilterDto dtoWithId = new BookingRequestAdminFilterDto(null, null, UUID.randomUUID(), null,
                null);
        assertTrue(filter.isApplicable(dtoWithId));

        BookingRequestAdminFilterDto dtoWithoutId = new BookingRequestAdminFilterDto(null, null, null, null, null);
        assertFalse(filter.isApplicable(dtoWithoutId));

        Specification<BookingRequest> spec = filter.buildSpecification(dtoWithId);
        assertNotNull(spec);

        Root<BookingRequest> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> listingPath = mock(Path.class);
        Path<Object> hostPath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);

        when(root.get("accommodationListing")).thenReturn(listingPath);
        when(listingPath.get("host")).thenReturn(hostPath);
        when(hostPath.get("id")).thenReturn(idPath);

        spec.toPredicate(root, query, cb);

        verify(cb).equal(idPath, dtoWithId.hostId());
    }

    @Test
    void testListingIdFilter() {
        ListingIdFilter filter = new ListingIdFilter();

        BookingRequestAdminFilterDto dtoWithId = new BookingRequestAdminFilterDto(UUID.randomUUID(), null, null, null,
                null);
        assertTrue(filter.isApplicable(dtoWithId));

        BookingRequestAdminFilterDto dtoWithoutId = new BookingRequestAdminFilterDto(null, null, null, null, null);
        assertFalse(filter.isApplicable(dtoWithoutId));

        Specification<BookingRequest> spec = filter.buildSpecification(dtoWithId);
        assertNotNull(spec);

        Root<BookingRequest> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> listingPath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);

        when(root.get("accommodationListing")).thenReturn(listingPath);
        when(listingPath.get("id")).thenReturn(idPath);

        spec.toPredicate(root, query, cb);

        verify(cb).equal(idPath, dtoWithId.accommodationListingId());
    }

    @Test
    void testStartDateFilter() {
        StartDateFilter filter = new StartDateFilter();

        BookingRequestAdminFilterDto dtoWithDate = new BookingRequestAdminFilterDto(null, null, null, null,
                LocalDate.now());
        assertTrue(filter.isApplicable(dtoWithDate));

        BookingRequestAdminFilterDto dtoWithoutDate = new BookingRequestAdminFilterDto(null, null, null, null, null);
        assertFalse(filter.isApplicable(dtoWithoutDate));

        Specification<BookingRequest> spec = filter.buildSpecification(dtoWithDate);
        assertNotNull(spec);

        Root<BookingRequest> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<LocalDate> datePath = mock(Path.class);

        when(root.get("startDate")).thenReturn((Path) datePath);

        spec.toPredicate(root, query, cb);

        verify(cb).greaterThanOrEqualTo(eq(datePath), eq(dtoWithDate.startDate()));
    }

    @Test
    void testStatusFilter() {
        StatusFilter filter = new StatusFilter();

        BookingRequestAdminFilterDto dtoWithStatus = new BookingRequestAdminFilterDto(null, null, null,
                RequestStatus.PENDING, null);
        assertTrue(filter.isApplicable(dtoWithStatus));

        BookingRequestAdminFilterDto dtoWithoutStatus = new BookingRequestAdminFilterDto(null, null, null, null, null);
        assertFalse(filter.isApplicable(dtoWithoutStatus));

        Specification<BookingRequest> spec = filter.buildSpecification(dtoWithStatus);
        assertNotNull(spec);

        Root<BookingRequest> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> statusPath = mock(Path.class);

        when(root.get("status")).thenReturn(statusPath);

        spec.toPredicate(root, query, cb);

        verify(cb).equal(statusPath, dtoWithStatus.status());
    }

    @Test
    void testTenantIdFilter() {
        TenantIdFilter filter = new TenantIdFilter();

        BookingRequestAdminFilterDto dtoWithId = new BookingRequestAdminFilterDto(null, UUID.randomUUID(), null, null,
                null);
        assertTrue(filter.isApplicable(dtoWithId));

        BookingRequestAdminFilterDto dtoWithoutId = new BookingRequestAdminFilterDto(null, null, null, null, null);
        assertFalse(filter.isApplicable(dtoWithoutId));

        Specification<BookingRequest> spec = filter.buildSpecification(dtoWithId);
        assertNotNull(spec);

        Root<BookingRequest> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> requesterPath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);

        when(root.get("requester")).thenReturn(requesterPath);
        when(requesterPath.get("id")).thenReturn(idPath);

        spec.toPredicate(root, query, cb);

        verify(cb).equal(idPath, dtoWithId.requesterId());
    }
}
