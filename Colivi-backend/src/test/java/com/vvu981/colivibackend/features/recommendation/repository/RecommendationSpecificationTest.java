package com.vvu981.colivibackend.features.recommendation.repository;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class RecommendationSpecificationTest {

    @Autowired
    private AccommodationListingRepository listingRepository;

    @Autowired
    private AccommodationRepository accommodationRepository;

    @Autowired
    private UserRepository userRepository;

    private AccommodationListing listing1;
    private AccommodationListing listing2;

    @BeforeEach
    void setUp() {
        User host = new User();
        host.setEmail("host@test.com");
        host.setPasswordHash("password");
        host.setFirstName("Host");
        host.setLastName1("User");
        host.setNickname("host123");
        host.setRole(UserRole.USER);
        host = userRepository.save(host);

        Accommodation acc1 = new Accommodation();
        acc1.setCity("Madrid");
        acc1.setCountry("Spain");
        acc1.setAddress("Calle 1");
        acc1.setOwner(host);
        acc1 = accommodationRepository.save(acc1);

        listing1 = new AccommodationListing();
        listing1.setHost(host);
        listing1.setAccommodation(acc1);
        listing1.setTitle("Room in Madrid");
        listing1.setDescription("Description");
        listing1.setPricePerMonth(new BigDecimal("500"));
        listing1.setSecurityDeposit(new BigDecimal("500"));
        listing1.setStatus(ListingStatus.AVAILABLE);
        listing1.setRentalType(RentalType.ROOM);
        listing1.setIsPromoted(true);
        listingRepository.save(listing1);

        Accommodation acc2 = new Accommodation();
        acc2.setCity("Barcelona");
        acc2.setCountry("Spain");
        acc2.setAddress("Calle 2");
        acc2.setOwner(host);
        acc2 = accommodationRepository.save(acc2);

        listing2 = new AccommodationListing();
        listing2.setHost(host);
        listing2.setAccommodation(acc2);
        listing2.setTitle("Flat in Barcelona");
        listing2.setDescription("Description");
        listing2.setPricePerMonth(new BigDecimal("1000"));
        listing2.setSecurityDeposit(new BigDecimal("1000"));
        listing2.setStatus(ListingStatus.AVAILABLE);
        listing2.setRentalType(RentalType.ENTIRE_PLACE);
        listing2.setIsPromoted(false);
        listingRepository.save(listing2);
    }

    @Test
    void buildRecommendationSpec_MatchesCity() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec("Madrid", null,
                (RentalType) null, null);
        List<AccommodationListing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(listing1.getId(), results.get(0).getId());
    }

    @Test
    void buildRecommendationSpec_MatchesMaxPrice() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(null,
                new BigDecimal("600"), (RentalType) null, null);
        List<AccommodationListing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(listing1.getId(), results.get(0).getId());
    }

    @Test
    void buildRecommendationSpec_MatchesRentalType() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(null, null,
                RentalType.ENTIRE_PLACE, null);
        List<AccommodationListing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(listing2.getId(), results.get(0).getId());
    }

    @Test
    void buildRecommendationSpec_ExcludesIds() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(null, null, (RentalType) null,
                List.of(listing1.getId()));
        List<AccommodationListing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(listing2.getId(), results.get(0).getId());
    }

    @Test
    void buildRecommendationSpec_EmptyParameters() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec("   ", null, (RentalType) null, new java.util.ArrayList<>());
        List<AccommodationListing> results = listingRepository.findAll(spec);
        assertEquals(2, results.size());
    }

    @Test
    void buildRecommendationSpec_PaginationAndCountQueryWorks() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec("Madrid", null, (RentalType) null, null);
        org.springframework.data.domain.Page<AccommodationListing> page = listingRepository.findAll(spec, org.springframework.data.domain.PageRequest.of(0, 10));
        assertEquals(1, page.getTotalElements());
        assertEquals(1, page.getContent().size());
        assertEquals(listing1.getId(), page.getContent().get(0).getId());
    }

    @Test
    void buildRecommendationSpec_FiltersByMinPrice() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(
                null, BigDecimal.valueOf(550), null, null, null, null
        );
        List<AccommodationListing> results = listingRepository.findAll(spec);
        assertEquals(1, results.size());
        assertEquals(listing2.getId(), results.get(0).getId());
    }

    @Test
    void testPrivateConstructor() throws Exception {
        java.lang.reflect.Constructor<RecommendationSpecification> constructor = RecommendationSpecification.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        try {
            constructor.newInstance();
            fail("Expected UnsupportedOperationException");
        } catch (java.lang.reflect.InvocationTargetException e) {
            assertTrue(e.getCause() instanceof UnsupportedOperationException);
        }
    }

    @Test
    void buildRecommendationSpec_MatchesTitle() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(
                "Room in Madrid", null, null, null, null, null, null
        );
        List<AccommodationListing> results = listingRepository.findAll(spec);
        assertEquals(1, results.size());
        assertEquals(listing1.getId(), results.get(0).getId());
    }

    @Test
    void buildRecommendationSpec_MatchesAmenitiesSuccess() {
        // Need to add an amenity to the accommodation first
        Accommodation acc = listing1.getAccommodation();
        acc.setAmenities(new java.util.HashSet<>(java.util.Set.of(com.vvu981.colivibackend.features.accommodation.domain.AmenityType.WIFI)));
        accommodationRepository.save(acc);

        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(
                null, null, null, null, RentalType.ROOM, List.of(com.vvu981.colivibackend.features.accommodation.domain.AmenityType.WIFI), null
        );
        List<AccommodationListing> results = listingRepository.findAll(spec);
        assertEquals(1, results.size());
        assertEquals(listing1.getId(), results.get(0).getId());
    }

    @Test
    void buildRecommendationSpec_SixArgsOverload() {
        Specification<AccommodationListing> spec = RecommendationSpecification.buildRecommendationSpec(
                "Madrid", BigDecimal.valueOf(100), BigDecimal.valueOf(1000), RentalType.ROOM, null, null
        );
        List<AccommodationListing> results = listingRepository.findAll(spec);
        assertEquals(1, results.size());
        assertEquals(listing1.getId(), results.get(0).getId());
    }
}
