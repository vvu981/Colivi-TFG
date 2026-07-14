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
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationVisibility;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationImageOrderRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationResponse;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationImageRepository;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationRepository;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationListingService;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;

@Service
public class AccommodationServiceImpl implements AccommodationService {

    private final AccommodationRepository accommodationRepository;
    private final IImageStorageService imageStorageService;
    private final AccommodationImageRepository accommodationImageRepository;
    private final AccommodationListingService listingService;
    private final UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public AccommodationServiceImpl(
            AccommodationRepository accommodationRepository,
            IImageStorageService imageStorageService,
            AccommodationImageRepository accommodationImageRepository,
            @org.springframework.context.annotation.Lazy AccommodationListingService listingService,
            UserRepository userRepository) {
        this.accommodationRepository = accommodationRepository;
        this.imageStorageService = imageStorageService;
        this.accommodationImageRepository = accommodationImageRepository;
        this.listingService = listingService;
        this.userRepository = userRepository;
    }

    private User getUser(UUID currentUserId) {
        return userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Error: Usuario no encontrado"));
    }

    @Override
    @Transactional
    public AccommodationResponse createAccommodation(AccommodationRequest accommodation, UUID currentUserId) {
        // En lugar de fetch, podemos usar getReferenceById si no requerimos leer datos:
        User owner = userRepository.getReferenceById(currentUserId);
        Accommodation accommodationToCreate = new Accommodation(accommodation, owner);

        Accommodation accommodationSaved = accommodationRepository.save(accommodationToCreate);

        return new AccommodationResponse(accommodationSaved);
    }

    @Override
    @Transactional
    public AccommodationResponse deleteAccommodationSoft(UUID accommodationId, UUID currentUserId) {
        Accommodation accommodationToSoftDelete = findAccommodationByIdAndDeletedAtIsNull(accommodationId);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationToSoftDelete, currentUser))
            throw new UnauthorizedActionException("Error: no puedes editar");
        accommodationToSoftDelete.setDeletedAt(LocalDateTime.now());
        Accommodation accommodationDeleted = accommodationRepository.save(accommodationToSoftDelete);

        List<AccommodationListing> associatedListings = listingService
                .findListingsByAccommodationId(accommodationDeleted.getId());

        for (AccommodationListing listing : associatedListings) {
            listingService.deleteAccommodationListingSoft(listing.getId(), currentUserId);
        }

        return new AccommodationResponse(accommodationDeleted);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteAccommodationHard(UUID accommodationId, UUID currentUserId) {

        Accommodation accommodationToDelete = accommodationRepository.findById(accommodationId)
                .orElseThrow(() -> new ResourceNotFoundException("Error: Accommodation not found."));

        List<AccommodationListing> associatedListings = listingService
                .findListingsByAccommodationId(accommodationToDelete.getId());

        for (AccommodationListing listing : associatedListings) {
            listingService.deleteAccommodationListingHard(listing.getId(), currentUserId);
        }

        accommodationRepository.delete(accommodationToDelete);

    }

    @Override
    @Transactional
    public AccommodationResponse updateAccommodation(UUID id, AccommodationRequest dto, UUID currentUserId) {
        Accommodation accommodationToUpdate = findAccommodationByIdAndDeletedAtIsNull(id);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationToUpdate, currentUser))
            throw new UnauthorizedActionException("Error: no puedes editar");

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
        Accommodation accommodation = findAccommodationByIdAndDeletedAtIsNull(id);
        return new AccommodationResponse(accommodation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccommodationResponse> getMyAccommodations(UUID ownerId, AccommodationVisibility visibility,
            int page, int size, UUID currentUserId) {

        User currentUser = getUser(currentUserId);
        UUID searchId = ownerId;

        if (currentUser.getRole() != UserRole.ADMIN) {
            searchId = currentUser.getId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Accommodation> accommodationEntities = accommodationRepository.findByFields(searchId, visibility.name(),
                pageable);

        return accommodationEntities.map(AccommodationResponse::new);
    }

    @Override
    @Transactional
    public AccommodationResponse addImageToAccommodation(UUID accommodationId, MultipartFile image, UUID currentUserId) {
        Accommodation accommodationToAdd = findAccommodationByIdAndDeletedAtIsNull(accommodationId);
        User currentUser = getUser(currentUserId);

        if (!canEdit(accommodationToAdd, currentUser)) {
            throw new UnauthorizedActionException("Error: no tienes permiso para añadir imágenes");
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
    public void removeImageFromAccommodation(UUID accommodationId, UUID imageId, UUID currentUserId) {
        Accommodation accommodation = findAccommodationByIdAndDeletedAtIsNull(accommodationId);
        User currentUser = getUser(currentUserId);

        if (!canEdit(accommodation, currentUser)) {
            throw new UnauthorizedActionException("Error: no tienes permiso para eliminar imágenes de este alojamiento");
        }

        AccommodationImage imageToDelete = accommodationImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Error: no se ha podido obtener la imagen a eliminar con el id: " + imageId + "."));

        if (!imageToDelete.getAccommodation().getId().equals(accommodationId)) {
            throw new BusinessRuleValidationException("Error: La imagen no pertenece al alojamiento especificado");
        }

        imageStorageService.deleteImage(imageToDelete.getImageUrl());

        accommodation.getImages().remove(imageToDelete);

        accommodationRepository.save(accommodation);
    }

    @Override
    @Transactional
    public AccommodationResponse updateImagesOrder(UUID accommodationId,
            List<AccommodationImageOrderRequest> orderRequests, UUID currentUserId) {
        Accommodation accommodation = findAccommodationByIdAndDeletedAtIsNull(accommodationId);
        User currentUser = getUser(currentUserId);

        if (!canEdit(accommodation, currentUser)) {
            throw new UnauthorizedActionException("Error: no tienes permiso para modificar este alojamiento");
        }

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
                .orElseThrow(() -> new ResourceNotFoundException("Error: Accommodation with id: " + id + " not found."));
    }

    private boolean canEdit(Accommodation accommodationToUpdate, User currentUser) {
        boolean isOwner = accommodationToUpdate.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        return isOwner || isAdmin;
    }

}
