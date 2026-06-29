package com.vvu981.colivibackend.features.accommodation.service.Impl;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccommodationServiceImpl implements AccommodationService {

    private final AccommodationRepository accommodationRepository;

    @Override
    public Accommodation createAccommodation(AccommodationRequest accommodation, User owner) {
        Accommodation accommodationToCreate = new Accommodation(accommodation, owner);
        return accommodationRepository.save(accommodationToCreate);
    }

    @Override
    @Transactional
    public Accommodation deleteAccommodationSoft(UUID accommodationId, User currUser) {
        Accommodation accommodationToSoftDelete = findAccommodationByIdAndDeletedAtIsNull(accommodationId);
        if (!canEdit(accommodationToSoftDelete, currUser))
            throw new RuntimeException("Error: no puedes editar");
        accommodationToSoftDelete.setDeletedAt(LocalDateTime.now());
        return accommodationRepository.save(accommodationToSoftDelete);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteAccommodationHard(UUID accommodationId, User currentUser) {

        Accommodation accommodationToDelete = accommodationRepository.findById(accommodationId)
                .orElseThrow(() -> new RuntimeException("Error: Accommodation not found."));
        accommodationRepository.delete(accommodationToDelete);
    }

    @Override
    @Transactional
    public Accommodation updateAccommodation(UUID id, AccommodationRequest dto, User currentUser) {
        Accommodation accommodationToUpdate = findAccommodationByIdAndDeletedAtIsNull(id);
        if (!canEdit(accommodationToUpdate, currentUser))
            throw new RuntimeException("Error: no puedes editar");

        accommodationToUpdate.setAddress(dto.address());
        accommodationToUpdate.setCity(dto.city());
        accommodationToUpdate.setCountry(dto.country());
        accommodationToUpdate.setFreeRooms(dto.freeRooms());
        accommodationToUpdate.setLatitude(dto.latitude());
        accommodationToUpdate.setLongitude(dto.longitude());
        accommodationToUpdate.setProvince(dto.province());
        accommodationToUpdate.setSquareMeters(dto.squareMeters());
        accommodationToUpdate.setTotalBathrooms(dto.totalBathrooms());
        accommodationToUpdate.setTotalRooms(dto.totalRooms());
        accommodationToUpdate.setUpdatedAt(LocalDateTime.now());

        // EN LUGAR DE: accommodationToUpdate.setAmenities(dto.amenities());
        accommodationToUpdate.getAmenities().clear();

        if (dto.amenities() != null) {
            accommodationToUpdate.getAmenities().addAll(dto.amenities());
        }

        return accommodationRepository.save(accommodationToUpdate);
    }

    @Override
    public Accommodation getAccommodation(UUID id) {
        return findAccommodationByIdAndDeletedAtIsNull(id);
    }

    @Override
    public Page<Accommodation> getAccommodationsCatalog(UUID userId, AccommodationVisibility visibility, int page,
            int size) {
        // Ordenamos siempre cronológicamente de la más nueva a la más antigua
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return accommodationRepository.findByFields(userId, visibility.name(), pageable);
    }

    private Accommodation findAccommodationByIdAndDeletedAtIsNull(UUID id) {
        return accommodationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Error: Accommodation with id: " + id + " not found."));
    }

    private boolean canEdit(Accommodation accommodationToUpdate, User currentUser) {
        // Permitimos la acción si es el dueño real O si el usuario actual es un
        // ADMINISTRADOR
        boolean isOwner = accommodationToUpdate.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN; // Ajusta esto según cómo tengas tus roles en la
                                                                   // entidad User

        return isOwner || isAdmin;
    }
}
