package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.domain.Message;
import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto;
import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto.AdminBookingSnippetDto;
import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto.AdminListingSnippetDto;
import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto.AdminUserSnippetDto;
import com.vvu981.colivibackend.features.messaging.dto.MessageResponseDto;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.repository.MessageRepository;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminConversationServiceImpl implements AdminConversationService {

    private static final int MAX_DOSSIER_MESSAGES = 200;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ReportRepository reportRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminConversationDossierDto getConversationDossier(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        boolean isReported = reportRepository.existsByTargetTypeAndTargetId(ReportTargetType.CONVERSATION, conversationId);

        AccommodationListing listing = conversation.getListing();
        String thumbnailUrl = null;
        String city = null;
        if (listing != null && listing.getAccommodation() != null) {
            city = listing.getAccommodation().getCity();
            if (listing.getAccommodation().getImages() != null && !listing.getAccommodation().getImages().isEmpty()) {
                thumbnailUrl = listing.getAccommodation().getImages().get(0).getImageUrl();
            }
        }

        AdminListingSnippetDto listingSnippet = listing != null ? new AdminListingSnippetDto(
                listing.getId(),
                listing.getTitle(),
                thumbnailUrl,
                listing.getPricePerMonth(),
                city,
                listing.getRentalType() != null ? listing.getRentalType().name() : null,
                listing.getStatus() != null ? listing.getStatus().name() : null
        ) : null;

        AdminUserSnippetDto tenantSnippet = toUserSnippet(conversation.getTenant());
        AdminUserSnippetDto hostSnippet = toUserSnippet(conversation.getHost());

        BookingRequest booking = conversation.getActiveBookingRequest();
        AdminBookingSnippetDto bookingSnippet = booking != null ? new AdminBookingSnippetDto(
                booking.getId(),
                booking.getStatus() != null ? booking.getStatus().name() : null,
                booking.getStartDate(),
                booking.getEndDate(),
                booking.getTransactionId()
        ) : null;

        Pageable pageable = PageRequest.of(0, MAX_DOSSIER_MESSAGES);
        List<Message> messages = messageRepository.findTopMessagesByConversationId(conversationId, pageable);
        List<MessageResponseDto> messageDtos = messages.stream()
                .map(m -> MessageResponseDto.fromEntity(m, null))
                .toList();

        return new AdminConversationDossierDto(
                conversation.getId(),
                listingSnippet,
                tenantSnippet,
                hostSnippet,
                bookingSnippet,
                messageDtos,
                conversation.getCreatedAt(),
                conversation.getLastMessageAt(),
                isReported
        );
    }

    private AdminUserSnippetDto toUserSnippet(User user) {
        if (user == null) return null;
        String lastName = user.getLastName1();
        if (user.getLastName2() != null && !user.getLastName2().isBlank()) {
            lastName = (lastName != null && !lastName.isBlank())
                    ? lastName + " " + user.getLastName2()
                    : user.getLastName2();
        }
        return new AdminUserSnippetDto(
                user.getId(),
                user.getNickname(),
                user.getFirstName(),
                lastName,
                user.getEmail(),
                user.getProfilePicUrl(),
                user.getRole() != null ? user.getRole().name() : null,
                user.isBanned(),
                user.getBannedUntil(),
                user.getBanReason()
        );
    }
}
