package com.vvu981.colivibackend.features.accommodation.service;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
import com.vvu981.colivibackend.features.user.domain.User;

@Service
public interface AccommodationListingService {

        AccommodationListingResponse createAccommodationListing(
                        AccommodationListingRequest accommodationListingRequest,
                        User currentUser);

        AccommodationListingResponse updateAccommodationListing(UUID listingId,
                        AccommodationListingUpdateRequest updateAccommodationListing, User currentUser);

        Page<AccommodationListingResponse> searchListings(Map<String, String> filters, int page, int size);

        void banAccommodationListing(UUID accommodationListingId, User currentUser); // solo admin

        void unBanAccommodationListing(UUID accommodationListingId, User currentUser); // solo admin

        void deleteAccommodationListingSoft(UUID accommodationId, User currentUser);

        void deleteAccommodationListingHard(UUID accommodationId, User currentUser); // solo admin

        AccommodationListingResponse recoverAccommodationListing(UUID accommodationId, User currentUser); // solo admin

        Page<AccommodationListingResponse> getBannedAccommodationListings(int page, int size, User currentUser);

        AccommodationListingResponse getAccommodationListing(UUID accommodationId);

}
