package com.vvu981.colivibackend.features.accommodation.service;

import java.util.UUID;

import org.springframework.data.domain.Page;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.user.domain.User;

public interface AccommodationService {

    Accommodation createAccommodation(AccommodationRequest accommodation, User owner);

    Accommodation deleteAccommodationSoft(UUID accommodationId, User currUser);

    void deleteAccommodationHard(UUID accommodationId, User currUser);

    Accommodation updateAccommodation(UUID id, AccommodationRequest dto, User currentUser);

    Accommodation getAccommodation(UUID id);

    Page<Accommodation> getDeletedAccommodations(int page, int size); // solo ADMIN

    Page<Accommodation> getAccommodationsByUser(User owner, int page, int size);
}
