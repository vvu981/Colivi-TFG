package com.vvu981.colivibackend.features.accommodation.service.Impl;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.vvu981.colivibackend.core.storage.service.IImageStorageService;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
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

    private final IImageStorageService imageStorageService;

    @Override
    @Transactional
    public AccommodationResponse createAccommodation(AccommodationRequest accommodation, User owner) {
        Accommodation accommodationToCreate = new Accommodation(accommodation, owner);

        Accommodation accommodationSaved = accommodationRepository.save(accommodationToCreate);

        return new AccommodationResponse(accommodationSaved);
    }

    @Override
    @Transactional
    public AccommodationResponse deleteAccommodationSoft(UUID accommodationId, User currUser) {
        Accommodation accommodationToSoftDelete = findAccommodationByIdAndDeletedAtIsNull(accommodationId);
        if (!canEdit(accommodationToSoftDelete, currUser))
            throw new RuntimeException("Error: no puedes editar");
        accommodationToSoftDelete.setDeletedAt(LocalDateTime.now());
        Accommodation accommodationDeleted = accommodationRepository.save(accommodationToSoftDelete);

        return new AccommodationResponse(accommodationDeleted);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteAccommodationHard(UUID accommodationId, User currUser) {

        Accommodation accommodationToDelete = accommodationRepository.findById(accommodationId)
                .orElseThrow(() -> new RuntimeException("Error: Accommodation not found."));
        accommodationRepository.delete(accommodationToDelete);
    }

    @Override
    @Transactional
    public AccommodationResponse updateAccommodation(UUID id, AccommodationRequest dto, User currUser) {
        Accommodation accommodationToUpdate = findAccommodationByIdAndDeletedAtIsNull(id);
        if (!canEdit(accommodationToUpdate, currUser))
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
        Accommodation accommodationUpdated = accommodationRepository.save(accommodationToUpdate);
        return new AccommodationResponse(accommodationUpdated);
    }

    @Override
    @Transactional(readOnly = true)
    public AccommodationResponse getAccommodation(UUID id) {
        // CORREGIDO: Buscamos la entidad interna y la empaquetamos en el objeto de
        // respuesta limpia
        Accommodation accommodation = findAccommodationByIdAndDeletedAtIsNull(id);
        return new AccommodationResponse(accommodation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccommodationResponse> getAccommodationsCatalog(UUID userId, AccommodationVisibility visibility,
            int page, int size) {
        // Ordenamos siempre cronológicamente de la más nueva a la más antigua
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // 1. Obtenemos la página original con las entidades de la base de datos
        Page<Accommodation> accommodationEntities = accommodationRepository.findByFields(userId, visibility.name(),
                pageable);

        // 2. CORREGIDO: Transformamos cada elemento de la página usando nuestro
        // constructor de respuesta
        return accommodationEntities.map(AccommodationResponse::new);
    }

    @Override
    @Transactional
    public AccommodationResponse addImageToAccommodation(UUID accommodationId, MultipartFile image, User currUser) {
        Accommodation accommodationToAdd = findAccommodationByIdAndDeletedAtIsNull(accommodationId);

        if (!canEdit(accommodationToAdd, currUser)) {
            throw new RuntimeException("Error: no tienes permiso para añadir imágenes");
        }

        String secureUrl = imageStorageService.uploadImage(image);

        AccommodationImage accommodationImageEntity = AccommodationImage.builder()
                .imageUrl(secureUrl)
                .accommodation(accommodationToAdd)
                .displayOrder(accommodationToAdd.getImages().size() + 1)
                .build();

        accommodationToAdd.getImages().add(accommodationImageEntity);

        Accommodation accommodationAdded = accommodationRepository.save(accommodationToAdd);

        return new AccommodationResponse(accommodationAdded);
    }

    private Accommodation findAccommodationByIdAndDeletedAtIsNull(UUID id) {
        return accommodationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Error: Accommodation with id: " + id + " not found."));
    }

    private boolean canEdit(Accommodation accommodationToUpdate, User currUser) {
        // Permitimos la acción si es el dueño real O si el usuario actual es un
        // ADMINISTRADOR
        boolean isOwner = accommodationToUpdate.getOwner().getId().equals(currUser.getId());
        boolean isAdmin = currUser.getRole() == UserRole.ADMIN; // Ajusta esto según cómo tengas tus roles en la
                                                                // entidad User

        return isOwner || isAdmin;
    }

}
