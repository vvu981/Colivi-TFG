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

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingRequest;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingResponse;
import com.vvu981.colivibackend.features.accommodation.dto.AccommodationListingUpdateRequest;
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
        return userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado"));
    }

    public AccommodationListingResponse createAccommodationListing(
            AccommodationListingRequest accommodationListingRequest, UUID currentUserId) {

        Accommodation accommodation = accommodationService
                .findAccommodationByIdAndDeletedAtIsNull(accommodationListingRequest.accommodationId());

        User currentUser = getUser(currentUserId);
        boolean isOwner = accommodation.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = isAdmin(currentUser);

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Error: No tienes permisos para publicar un anuncio en este alojamiento");
        }

        AccommodationListing accommodationListingToUpload = new AccommodationListing(accommodationListingRequest,
                accommodation);

        listingRepository.save(accommodationListingToUpload);
        AccommodationListingResponse accommodationListingResponse = new AccommodationListingResponse(
                accommodationListingToUpload);
        return accommodationListingResponse;
    }

    @Override
    public void deleteAccommodationListingSoft(UUID accommodationId, UUID currentUserId) {
        AccommodationListing accommodationListing = findAccommodationListingById(accommodationId);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationListing, currentUser))
            throw new RuntimeException("Error: no puedes eliminar el anuncio con id: " + accommodationId + ".");

        if (accommodationListing.getDeletedAt() != null)
            throw new RuntimeException("Error: el anuncio con id: " + accommodationId + " ya esta eliminado.");

        accommodationListing.setDeletedAt(LocalDateTime.now());
        listingRepository.save(accommodationListing);

    }

    @Override
    public void deleteAccommodationListingHard(UUID accommodationId, UUID currentUserId) {
        AccommodationListing accommodationListing = findAccommodationListingById(accommodationId);
        User currentUser = getUser(currentUserId);
        if (!isAdmin(currentUser))
            throw new RuntimeException("Error: no tienes permisos para esa accion.");

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
            throw new RuntimeException("Error: No tienes permiso para editar este anuncio");
        }

        listing.setTitle(dto.title());
        listing.setDescription(dto.description());
        listing.setPricePerMonth(dto.pricePerMonth());

        AccommodationListing updatedListing = listingRepository.save(listing);

        return new AccommodationListingResponse(updatedListing);
    }

    @Override
    public void banAccommodationListing(UUID accommodationListingId, UUID currentUserId) { // solo admin
        User currentUser = getUser(currentUserId);
        if (!isAdmin(currentUser)) {
            throw new RuntimeException("Error: no tienes permisos");
        }
        AccommodationListing accommodationToBan = findAccommodationListingById(accommodationListingId);

        if (accommodationToBan.getStatus().equals(ListingStatus.BANNED))
            throw new RuntimeException("Error: este anuncio ya está baneado.");

        accommodationToBan.ban();

        listingRepository.save(accommodationToBan);
    }

    @Override
    public void unBanAccommodationListing(UUID accommodationListingId, UUID currentUserId) { // solo admin
        User currentUser = getUser(currentUserId);
        if (!isAdmin(currentUser)) {
            throw new RuntimeException("Error: no tienes permisos");
        }
        AccommodationListing accommodationToUnBan = findAccommodationListingById(accommodationListingId);

        if (!accommodationToUnBan.getStatus().equals(ListingStatus.BANNED))
            throw new RuntimeException("Error: este anuncio no está baneado.");

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
    public AccommodationListingResponse recoverAccommodationListing(UUID accommodationId, UUID currentUserId) {
        AccommodationListing accommodationListing = findAccommodationListingById(accommodationId);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationListing, currentUser))
            throw new RuntimeException("Error: no tienes permisos para esta accion.");

        if (accommodationListing.getDeletedAt() == null)
            throw new RuntimeException("Error: el anuncio con id: " + accommodationId + " no esta eliminado.");

        if (accommodationListing.getBannedAt() != null)
            throw new RuntimeException("Error: el anuncio con id: " + accommodationId + " esta baneado.");

        if (accommodationListing.getDeletedAt().plusDays(7).isBefore(LocalDateTime.now()))
            throw new RuntimeException("Error: se te ha pasado el tiempo de recuperacion.");

        accommodationListing.setDeletedAt(null);
        listingRepository.save(accommodationListing);

        return new AccommodationListingResponse(accommodationListing);
    }

    @Override
    public AccommodationListingResponse getAccommodationListing(UUID accommodationId) {
        return new AccommodationListingResponse(findAccommodationListingById(accommodationId));
    }

    @Override
    public Page<AccommodationListingResponse> getBannedAccommodationListings(int page, int size, UUID currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("bannedAt").descending());

        Page<AccommodationListing> bannedListings = listingRepository
                .findByStatusAndDeletedAtIsNull(ListingStatus.BANNED, pageable);

        return bannedListings.map(AccommodationListingResponse::new);
    }

    @Override
    public void changeStatusListing(UUID accommodationId, ListingStatus listingStatus, UUID currentUserId) {
        if (listingStatus.equals(ListingStatus.BANNED))
            throw new RuntimeException("Donde ibas pillin?");

        AccommodationListing accommodationListing = findAccommodationListingById(accommodationId);
        User currentUser = getUser(currentUserId);
        if (!canEdit(accommodationListing, currentUser))
            throw new RuntimeException("Error: No tienes permiso para editar este anuncio");

        if (accommodationListing.getStatus().equals(listingStatus))
            throw new RuntimeException("Error: Este anuncio ya esta " + listingStatus.toString());

        accommodationListing.setStatus(listingStatus);
        listingRepository.save(accommodationListing);
    }

    @Override
    public AccommodationListing findAccommodationListingById(UUID accommodationListingId) {
        AccommodationListing accommodationListing = listingRepository.findById(accommodationListingId)
                .orElseThrow(() -> new RuntimeException(
                        "Error: no se encuentra el anuncio con id: " + accommodationListingId + "."));
        return accommodationListing;
    }

    @Override
    public List<AccommodationListing> findListingsByAccommodationId(UUID accommodationId) {
        return listingRepository.findByAccommodationIdAndDeletedAtIsNull(accommodationId);
    }

    private boolean isAdmin(User currentUser) {
        return currentUser.getRole().equals(UserRole.ADMIN);
    }

    private boolean canEdit(AccommodationListing accommodationListing, User currentUser) {
        boolean isAdmin = isAdmin(currentUser);
        boolean isOwner = accommodationListing.getAccommodation().getOwner().getId().equals(currentUser.getId());
        boolean isHost = accommodationListing.getHost().getId().equals(currentUser.getId());
        return isAdmin || (isOwner && isHost);
    }

}
