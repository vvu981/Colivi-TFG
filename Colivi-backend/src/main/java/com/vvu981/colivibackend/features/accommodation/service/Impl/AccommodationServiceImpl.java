package com.vvu981.colivibackend.features.accommodation.service.Impl;

import java.time.LocalDateTime;
import java.util.List;
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
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationImageOrderRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationImageRepository;
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

    private final AccommodationImageRepository accommodationImageRepository;

    @Override
    @Transactional
    public AccommodationResponse createAccommodation(AccommodationRequest accommodation, User owner) {
        Accommodation accommodationToCreate = new Accommodation(accommodation, owner);

        Accommodation accommodationSaved = accommodationRepository.save(accommodationToCreate);

        return new AccommodationResponse(accommodationSaved);
    }

    @Override
    @Transactional
    public AccommodationResponse deleteAccommodationSoft(UUID accommodationId, User currentUser) {
        Accommodation accommodationToSoftDelete = findAccommodationByIdAndDeletedAtIsNull(accommodationId);
        if (!canEdit(accommodationToSoftDelete, currentUser))
            throw new RuntimeException("Error: no puedes editar");
        accommodationToSoftDelete.setDeletedAt(LocalDateTime.now());
        Accommodation accommodationDeleted = accommodationRepository.save(accommodationToSoftDelete);

        return new AccommodationResponse(accommodationDeleted);
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
    public AccommodationResponse updateAccommodation(UUID id, AccommodationRequest dto, User currentUser) {
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
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Accommodation> accommodationEntities = accommodationRepository.findByFields(userId, visibility.name(),
                pageable);

        return accommodationEntities.map(AccommodationResponse::new);
    }

    @Override
    @Transactional
    public AccommodationResponse addImageToAccommodation(UUID accommodationId, MultipartFile image, User currentUser) {
        Accommodation accommodationToAdd = findAccommodationByIdAndDeletedAtIsNull(accommodationId);

        if (!canEdit(accommodationToAdd, currentUser)) {
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

    @Override
    @Transactional
    public void removeImageFromAccommodation(UUID accommodationId, UUID imageId, User currentUser) {
        Accommodation accommodation = findAccommodationByIdAndDeletedAtIsNull(accommodationId);

        if (!canEdit(accommodation, currentUser)) {
            throw new RuntimeException("Error: no tienes permiso para eliminar imágenes de este alojamiento");
        }

        AccommodationImage imageToDelete = accommodationImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException(
                        "Error: no se ha podido obtener la imagen a eliminar con el id: " + imageId + "."));

        if (!imageToDelete.getAccommodation().getId().equals(accommodationId)) {
            throw new RuntimeException("Error: La imagen no pertenece al alojamiento especificado");
        }

        imageStorageService.deleteImage(imageToDelete.getImageUrl());

        accommodation.getImages().remove(imageToDelete);

        accommodationRepository.save(accommodation);
    }

    @Override
    @Transactional
    public AccommodationResponse updateImagesOrder(UUID accommodationId,
            List<AccommodationImageOrderRequest> orderRequests, User currentUser) {
        Accommodation accommodation = findAccommodationByIdAndDeletedAtIsNull(accommodationId);

        if (!canEdit(accommodation, currentUser)) {
            throw new RuntimeException("Error: no tienes permiso para modificar este alojamiento");
        }

        // Recorremos las peticiones del frontend y actualizamos el orden en la lista
        // interna
        for (AccommodationImageOrderRequest req : orderRequests) {
            accommodation.getImages().stream()
                    .filter(img -> img.getId().equals(req.imageId()))
                    .findFirst()
                    .ifPresent(img -> img.setDisplayOrder(req.displayOrder()));
        }

        Accommodation updated = accommodationRepository.save(accommodation);
        return new AccommodationResponse(updated);
    }

    @Override
    public Accommodation findAccommodationByIdAndDeletedAtIsNull(UUID id) {
        return accommodationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Error: Accommodation with id: " + id + " not found."));
    }

    private boolean canEdit(Accommodation accommodationToUpdate, User currentUser) {

        boolean isOwner = accommodationToUpdate.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        return isOwner || isAdmin;
    }

}
