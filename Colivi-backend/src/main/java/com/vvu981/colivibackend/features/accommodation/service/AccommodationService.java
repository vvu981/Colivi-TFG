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

public interface AccommodationService {

        AccommodationResponse createAccommodation(AccommodationRequest accommodation, UUID currentUserId);

        AccommodationResponse deleteAccommodationSoft(UUID accommodationId, UUID currentUserId);

        void deleteAccommodationHard(UUID accommodationId, UUID currentUserId); // solo admin

        AccommodationResponse updateAccommodation(UUID id, AccommodationRequest dto, UUID currentUserId);

        AccommodationResponse getAccommodation(UUID id);

        Page<AccommodationResponse> getMyAccommodations(UUID ownerId, AccommodationVisibility visibility, int page,
                        int size, UUID currentUserId);

        AccommodationResponse addImageToAccommodation(UUID accommodationId, MultipartFile file, UUID currentUserId);

        void removeImageFromAccommodation(UUID accommodationId, UUID imageId, UUID currentUserId);

        AccommodationResponse updateImagesOrder(UUID accommodationId,
                        List<AccommodationImageOrderRequest> orderRequests, UUID currentUserId);

        Accommodation findAccommodationByIdAndDeletedAtIsNull(UUID id);
}
