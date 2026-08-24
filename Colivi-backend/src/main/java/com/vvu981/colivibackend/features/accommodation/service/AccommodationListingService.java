package com.vvu981.colivibackend.features.accommodation.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingStatsDTO;

@Service
public interface AccommodationListingService {

        AccommodationListingResponse createAccommodationListing(
                        AccommodationListingRequest accommodationListingRequest,
                        UUID currentUserId);

        AccommodationListingResponse updateAccommodationListing(UUID listingId,
                        AccommodationListingUpdateRequest updateAccommodationListing, UUID currentUserId);

        Page<AccommodationListingResponse> searchListings(Map<String, String> filters, int page, int size);

        void banAccommodationListing(UUID accommodationListingId, UUID currentUserId); // solo admin

        void unBanAccommodationListing(UUID accommodationListingId, UUID currentUserId); // solo admin

        void deleteAccommodationListingSoft(UUID listingId, UUID currentUserId);

        void deleteAccommodationListingHard(UUID listingId, UUID currentUserId); // solo admin

        AccommodationListingResponse recoverAccommodationListing(UUID listingId, UUID currentUserId); // solo admin

        Page<AccommodationListingResponse> searchAllListingsForAdmin(Map<String, String> filters, int page, int size);

        AccommodationListingResponse getAccommodationListing(UUID listingId);

        void changeStatusListing(UUID listingId, ListingStatus listingStatus, UUID currentUserId);

        AccommodationListing findAccommodationListingById(UUID accommodationListingId);

        List<AccommodationListing> findListingsByAccommodationId(UUID accommodationId);

        List<AccommodationListing> findAvailableListingsByAccommodationId(UUID accommodationId);

        void softDeleteAllByAccommodationId(UUID accommodationId);

        AccommodationListingStatsDTO getListingStatsForAccommodation(UUID accommodationId);
}
