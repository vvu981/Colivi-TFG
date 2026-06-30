package com.vvu981.colivibackend.features.accommodation.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.user.domain.User;

public interface AccommodationService {

    AccommodationResponse createAccommodation(AccommodationRequest accommodation, User owner);

    AccommodationResponse deleteAccommodationSoft(UUID accommodationId, User currUser);

    void deleteAccommodationHard(UUID accommodationId, User currUser);

    AccommodationResponse updateAccommodation(UUID id, AccommodationRequest dto, User currUser);

    AccommodationResponse getAccommodation(UUID id);

    Page<AccommodationResponse> getAccommodationsCatalog(UUID ownerId, AccommodationVisibility visibility, int page,
            int size);

    AccommodationResponse addImageToAccommodation(UUID accommodationId, MultipartFile file, User currUser);

    void removeImageFromAccommodation(UUID accommodationId, UUID imageId, User currentUser);
}