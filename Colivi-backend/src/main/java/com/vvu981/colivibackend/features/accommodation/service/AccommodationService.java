package com.vvu981.colivibackend.features.accommodation.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationImageOrderRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.user.domain.User;

public interface AccommodationService {

        AccommodationResponse createAccommodation(AccommodationRequest accommodation, User owner);

        AccommodationResponse deleteAccommodationSoft(UUID accommodationId, User currentUser);

        void deleteAccommodationHard(UUID accommodationId, User currentUser); // solo admin

        AccommodationResponse updateAccommodation(UUID id, AccommodationRequest dto, User currentUser);

        AccommodationResponse getAccommodation(UUID id);

        Page<AccommodationResponse> getMyAccommodations(UUID ownerId, AccommodationVisibility visibility, int page,
                        int size, User currentUser);

        AccommodationResponse addImageToAccommodation(UUID accommodationId, MultipartFile file, User currentUser);

        void removeImageFromAccommodation(UUID accommodationId, UUID imageId, User currentUser);

        AccommodationResponse updateImagesOrder(UUID accommodationId,
                        List<AccommodationImageOrderRequest> orderRequests, User currentUser);

        Accommodation findAccommodationByIdAndDeletedAtIsNull(UUID id);
}