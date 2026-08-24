package com.vvu981.colivibackend.features.accommodation.service.Impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.domain.RentalType;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationImage;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingStatsDTO;
import java.util.ArrayList;
import java.util.stream.Collectors;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.accommodation.repository.specification.ListingSpecificationBuilder;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationListingService;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccommodationListingServiceImpl implements AccommodationListingService {

    private final AccommodationListingRepository listingRepository;
    private final ListingSpecificationBuilder specificationBuilder;
    private final AccommodationService accommodationService;
    private final UserRepository userRepository;

    private User getUser(UUID currentUserId) {
        return userRepository.findActiveById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Error: Usuario no encontrado"));
    }

    @Override
    @Transactional
    public AccommodationListingResponse createAccommodationListing(
            AccommodationListingRequest accommodationListingRequest, UUID currentUserId) {

        // --- PREVENCION DE DoS: Verificar autorizacion ANTES del bloqueo pesimista ---
        Accommodation authCheckAcc = accommodationService
                .findAccommodationByIdAndDeletedAtIsNull(accommodationListingRequest.accommodationId());

        User currentUser = getUser(currentUserId);
        boolean isOwner = authCheckAcc.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = isAdmin(currentUser);

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException(
                    "Error: No tienes permisos para publicar un anuncio en este alojamiento");
        }

        // --- BLOQUEO PESIMISTA: Ahora es seguro bloquear la fila ---
        Accommodation accommodation = accommodationService
                .findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(accommodationListingRequest.accommodationId());

        // --- BLINDAJE DE REGLAS DE NEGOCIO ---
        validateCapacityRules(accommodation, accommodationListingRequest.rentalType());
        // -------------------------------------

        AccommodationListing accommodationListingToUpload = new AccommodationListing(accommodationListingRequest,
                accommodation);

        // --- MAPEO DE IMÁGENES SELECCIONADAS ---
        if (accommodationListingRequest.selectedImages() != null
                && !accommodationListingRequest.selectedImages().isEmpty()) {
            List<AccommodationImage> mappedImages = new ArrayList<>();
            List<UUID> requestedImageIds = new ArrayList<>(
                    new java.util.LinkedHashSet<>(accommodationListingRequest.selectedImages()));

            Map<UUID, AccommodationImage> accImagesMap = accommodation.getImages().stream()
                    .collect(Collectors.toMap(AccommodationImage::getId, img -> img));

            for (int i = 0; i < requestedImageIds.size(); i++) {
                UUID imageId = requestedImageIds.get(i);
                AccommodationImage accImage = accImagesMap.get(imageId);
                if (accImage == null) {
                    throw new BusinessRuleValidationException(
                            "La imagen con id " + imageId + " no pertenece a este alojamiento.");
                }
                mappedImages.add(accImage);
            }
            accommodationListingToUpload.updateImages(mappedImages);
        }

        listingRepository.save(accommodationListingToUpload);
        return new AccommodationListingResponse(accommodationListingToUpload);
    }

    @Override
    @Transactional
    public void deleteAccommodationListingSoft(UUID listingId, UUID currentUserId) {
        AccommodationListing accommodationListing = findAccommodationListingById(listingId);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationListing, currentUser))
            throw new UnauthorizedActionException(
                    "Error: no puedes eliminar el anuncio con id: " + listingId + ".");

        if (accommodationListing.getDeletedAt() != null)
            throw new BusinessRuleValidationException(
                    "Error: el anuncio con id: " + listingId + " ya esta eliminado.");

        accommodationListing.setDeletedAt(LocalDateTime.now());
        listingRepository.save(accommodationListing);

    }

    @Override
    @Transactional
    public void deleteAccommodationListingHard(UUID listingId, UUID currentUserId) {
        AccommodationListing accommodationListing = findAccommodationListingIncludingDeletedById(listingId);
        User currentUser = getUser(currentUserId);
        if (!isAdmin(currentUser))
            throw new UnauthorizedActionException("Error: no tienes permisos para esa accion.");

        listingRepository.delete(accommodationListing);
    }

    @Override
    @Transactional
    public AccommodationListingResponse updateAccommodationListing(
            UUID listingId,
            AccommodationListingUpdateRequest dto,
            UUID currentUserId) {

        AccommodationListing listing = findAccommodationListingById(listingId);
        User currentUser = getUser(currentUserId);

        if (!canEdit(listing, currentUser)) {
            throw new UnauthorizedActionException("Error: No tienes permiso para editar este anuncio");
        }

        listing.updateInformation(dto.title(), dto.description(), dto.pricePerMonth());

        // --- MAPEO DE IMÁGENES SELECCIONADAS ---
        if (dto.selectedImages() != null) {
            if (!dto.selectedImages().isEmpty()) {
                List<AccommodationImage> mappedImages = new ArrayList<>();
                List<UUID> requestedImageIds = new ArrayList<>(new java.util.LinkedHashSet<>(dto.selectedImages()));
                Accommodation accommodation = accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNull(listing.getAccommodation().getId());

                Map<UUID, AccommodationImage> accImagesMap = accommodation.getImages().stream()
                        .collect(Collectors.toMap(AccommodationImage::getId, img -> img));

                for (int i = 0; i < requestedImageIds.size(); i++) {
                    UUID imageId = requestedImageIds.get(i);
                    AccommodationImage accImage = accImagesMap.get(imageId);
                    if (accImage == null) {
                        throw new BusinessRuleValidationException(
                                "La imagen con id " + imageId + " no pertenece a este alojamiento.");
                    }
                    mappedImages.add(accImage);
                }
                listing.updateImages(mappedImages);
            } else {
                listing.updateImages(new ArrayList<>());
            }
        }

        AccommodationListing updatedListing = listingRepository.save(listing);

        return new AccommodationListingResponse(updatedListing);
    }

    @Override
    @Transactional
    public void banAccommodationListing(UUID accommodationListingId, UUID currentUserId) { // solo admin
        User currentUser = getUser(currentUserId);
        if (!isAdmin(currentUser)) {
            throw new UnauthorizedActionException("Error: no tienes permisos");
        }
        AccommodationListing accommodationToBan = findAccommodationListingById(accommodationListingId);

        if (accommodationToBan.getStatus().equals(ListingStatus.BANNED))
            throw new BusinessRuleValidationException("Error: este anuncio ya está baneado.");

        accommodationToBan.ban();

        listingRepository.save(accommodationToBan);
    }

    @Override
    @Transactional
    public void unBanAccommodationListing(UUID accommodationListingId, UUID currentUserId) { // solo admin
        User currentUser = getUser(currentUserId);
        if (!isAdmin(currentUser)) {
            throw new UnauthorizedActionException("Error: no tienes permisos");
        }
        AccommodationListing accommodationToUnBan = findAccommodationListingIncludingDeletedById(accommodationListingId);

        if (!accommodationToUnBan.getStatus().equals(ListingStatus.BANNED))
            throw new BusinessRuleValidationException("Error: este anuncio no está baneado.");

        Accommodation lockedAccommodation = accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(accommodationToUnBan.getAccommodation().getId());
        validateCapacityRules(lockedAccommodation, accommodationToUnBan.getRentalType());

        accommodationToUnBan.unBan();

        listingRepository.save(accommodationToUnBan);

    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccommodationListingResponse> searchListings(Map<String, String> filters, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Llamamos al constructor de especificaciones dinámicas SOLID
        Specification<AccommodationListing> spec = specificationBuilder.buildSpecification(filters);

        Page<AccommodationListing> listings = listingRepository.findAll(spec, pageable);
        return listings.map(AccommodationListingResponse::new);
    }

    @Override
    @Transactional
    public AccommodationListingResponse recoverAccommodationListing(UUID listingId, UUID currentUserId) {
        AccommodationListing accommodationListing = findAccommodationListingIncludingDeletedById(listingId);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationListing, currentUser))
            throw new UnauthorizedActionException("Error: no tienes permisos para esta accion.");

        if (accommodationListing.getDeletedAt() == null)
            throw new BusinessRuleValidationException(
                    "Error: el anuncio con id: " + listingId + " no esta eliminado.");

        if (accommodationListing.getBannedAt() != null)
            throw new BusinessRuleValidationException(
                    "Error: el anuncio con id: " + listingId + " esta baneado.");

        if (accommodationListing.getDeletedAt().plusDays(7).isBefore(LocalDateTime.now()))
            throw new BusinessRuleValidationException("Error: se te ha pasado el tiempo de recuperacion.");

        if (accommodationListing.getAccommodation().getDeletedAt() != null)
            throw new BusinessRuleValidationException(
                    "Error: no puedes recuperar un anuncio de un alojamiento eliminado.");

        // Volver a validar reglas de capacidad para evitar estados inconsistentes
        Accommodation lockedAccommodation = accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(accommodationListing.getAccommodation().getId());
        validateCapacityRules(lockedAccommodation, accommodationListing.getRentalType());

        accommodationListing.setDeletedAt(null);
        listingRepository.save(accommodationListing);

        return new AccommodationListingResponse(accommodationListing);
    }

    @Override
    @Transactional(readOnly = true)
    public AccommodationListingResponse getAccommodationListing(UUID listingId, UUID currentUserId) {
        AccommodationListing listing = findAccommodationListingById(listingId);
        
        if (listing.getStatus() != ListingStatus.AVAILABLE) {
            if (currentUserId == null) {
                throw new ResourceNotFoundException("Error: no se encuentra el anuncio con id: " + listingId + ".");
            }
            User currentUser = getUser(currentUserId);
            if (!canEdit(listing, currentUser)) {
                throw new ResourceNotFoundException("Error: no se encuentra el anuncio con id: " + listingId + ".");
            }
        }
        
        return new AccommodationListingResponse(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccommodationListingResponse> searchAllListingsForAdmin(Map<String, String> filters, int page,
            int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Specification<AccommodationListing> spec = specificationBuilder.buildAdminSpecification(filters);

        Page<AccommodationListing> listings = listingRepository.findAll(spec, pageable);
        return listings.map(AccommodationListingResponse::new);
    }

    @Override
    @Transactional
    public void changeStatusListing(UUID listingId, ListingStatus listingStatus, UUID currentUserId) {
        if (ListingStatus.BANNED == listingStatus)
            throw new UnauthorizedActionException("Error: El estado BANNED no puede establecerse por esta vía. Utilice el endpoint específico de moderación (/ban).");

        AccommodationListing accommodationListing = findAccommodationListingById(listingId);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationListing, currentUser))
            throw new UnauthorizedActionException("Error: No tienes permiso para editar este anuncio");

        if (accommodationListing.getStatus() == ListingStatus.BANNED)
            throw new UnauthorizedActionException("Error: No puedes modificar el estado de un anuncio baneado.");

        if (accommodationListing.getStatus() == listingStatus)
            throw new BusinessRuleValidationException("Error: Este anuncio ya esta " + listingStatus);

        if (listingStatus == ListingStatus.AVAILABLE) {
            Accommodation lockedAccommodation = accommodationService.findAccommodationWithImagesByIdAndDeletedAtIsNullWithPessimisticLock(accommodationListing.getAccommodation().getId());
            validateCapacityRules(lockedAccommodation, accommodationListing.getRentalType());
        }

        accommodationListing.setStatus(listingStatus);
        listingRepository.save(accommodationListing);
    }

    @Override
    public AccommodationListing findAccommodationListingById(UUID accommodationListingId) {
        AccommodationListing accommodationListing = listingRepository.findById(accommodationListingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Error: no se encuentra el anuncio con id: " + accommodationListingId + "."));
        
        if (accommodationListing.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Error: el anuncio con id: " + accommodationListingId + " no existe o fue eliminado.");
        }
        return accommodationListing;
    }

    @Override
    public AccommodationListing findAccommodationListingIncludingDeletedById(UUID accommodationListingId) {
        return listingRepository.findById(accommodationListingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Error: no se encuentra el anuncio con id: " + accommodationListingId + "."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccommodationListing> findListingsByAccommodationId(UUID accommodationId) {
        return listingRepository.findByAccommodationIdAndDeletedAtIsNull(accommodationId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccommodationListing> findAvailableListingsByAccommodationId(UUID accommodationId) {
        return listingRepository.findByAccommodationIdAndStatusAndDeletedAtIsNull(accommodationId,
                ListingStatus.AVAILABLE);
    }

    private boolean isAdmin(User currentUser) {
        return currentUser.getRole() == UserRole.ADMIN;
    }

    private boolean canEdit(AccommodationListing accommodationListing, User currentUser) {
        boolean isAdmin = isAdmin(currentUser);
        boolean isOwner = accommodationListing.getAccommodation().getOwner().getId().equals(currentUser.getId());
        boolean isHost = accommodationListing.getHost().getId().equals(currentUser.getId());
        return isAdmin || isOwner || isHost;
    }

    private void validateCapacityRules(Accommodation accommodation, RentalType rentalType) {
        UUID accId = accommodation.getId();
        AccommodationListingStatsDTO stats = listingRepository.getListingStatsForAccommodation(accId);

        if (stats.entirePlaceCount() > 0) {
            throw new BusinessRuleValidationException("El inmueble ya está alquilado por completo.");
        }

        if (rentalType == RentalType.ENTIRE_PLACE) {
            if (stats.roomCount() > 0) {
                throw new BusinessRuleValidationException(
                        "No se puede alquilar la casa entera si ya hay habitaciones comprometidas.");
            }
        } else if (rentalType == RentalType.ROOM) {
            if (stats.roomCount() >= accommodation.getTotalRooms()) {
                throw new BusinessRuleValidationException("Se alcanzó el límite de habitaciones del inmueble.");
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AccommodationListingStatsDTO getListingStatsForAccommodation(UUID accommodationId) {
        return listingRepository.getListingStatsForAccommodation(accommodationId);
    }

    @Override
    @Transactional
    public void softDeleteAllByAccommodationId(UUID accommodationId) {
        listingRepository.softDeleteAllByAccommodationId(accommodationId, LocalDateTime.now());
    }

}
