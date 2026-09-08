package com.vvu981.colivibackend.features.messaging.dto;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.user.domain.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationSummaryDto(
    UUID conversationId,
    UUID listingId,
    String listingTitle,
    String listingThumbnailUrl,
    BigDecimal listingPricePerMonth,
    UUID interlocutorId,
    String interlocutorName,
    String interlocutorProfilePic,
    UUID activeBookingRequestId,
    String bookingStatus,
    LocalDate bookingStartDate,
    LocalDate bookingEndDate,
    String lastMessagePreview,
    LocalDateTime lastMessageAt,
    Integer unreadCount,
    Integer interlocutorUnreadCount,
    boolean isArchived,
    boolean isHost,
    boolean isReported,
    boolean isReadOnly
) {
    public ConversationSummaryDto(
            UUID conversationId,
            UUID listingId,
            String listingTitle,
            String listingThumbnailUrl,
            BigDecimal listingPricePerMonth,
            UUID interlocutorId,
            String interlocutorName,
            String interlocutorProfilePic,
            UUID activeBookingRequestId,
            String bookingStatus,
            LocalDate bookingStartDate,
            LocalDate bookingEndDate,
            String lastMessagePreview,
            LocalDateTime lastMessageAt,
            Integer unreadCount,
            Integer interlocutorUnreadCount,
            boolean isArchived,
            boolean isHost,
            boolean isReported) {
        this(conversationId, listingId, listingTitle, listingThumbnailUrl, listingPricePerMonth,
             interlocutorId, interlocutorName, interlocutorProfilePic, activeBookingRequestId,
             bookingStatus, bookingStartDate, bookingEndDate, lastMessagePreview, lastMessageAt,
             unreadCount, interlocutorUnreadCount, isArchived, isHost, isReported, false);
    }

    public static ConversationSummaryDto fromEntity(Conversation conversation, UUID currentUserId) {
        return fromEntity(conversation, currentUserId, false);
    }

    public static ConversationSummaryDto fromEntity(Conversation conversation, UUID currentUserId, boolean isReported) {
        boolean isCurrentUserHost = conversation.getHost().getId().equals(currentUserId);
        User interlocutor = isCurrentUserHost ? conversation.getTenant() : conversation.getHost();
        AccommodationListing listing = conversation.getListing();
        BookingRequest booking = conversation.getActiveBookingRequest();

        Integer unread = isCurrentUserHost 
                ? conversation.getHostUnreadCount() 
                : conversation.getTenantUnreadCount();

        Integer interlocutorUnread = isCurrentUserHost 
                ? conversation.getTenantUnreadCount() 
                : conversation.getHostUnreadCount();

        boolean archived = isCurrentUserHost 
                ? conversation.getArchivedByHost() 
                : conversation.getArchivedByTenant();

        String statusStr = "CONSULTATION";
        LocalDate startDate = null;
        LocalDate endDate = null;
        UUID bookingId = null;

        if (booking != null) {
            boolean isRejected = booking.getStatus() == com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus.REJECTED;
            boolean isCancelledWithoutDeposit = booking.getStatus() == com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus.CANCELLED 
                    && booking.getTransactionId() == null;
            boolean isExpired = booking.getStatus() == com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus.EXPIRED;

            if (!isRejected && !isCancelledWithoutDeposit && !isExpired) {
                statusStr = booking.getStatus().name();
                startDate = booking.getStartDate();
                endDate = booking.getEndDate();
                bookingId = booking.getId();
            }
        }

        // Determinar si el canal está en modo solo lectura
        boolean isReadOnly = false;
        if (listing != null && (listing.getBannedAt() != null || listing.getDeletedAt() != null)) {
            isReadOnly = true;
        } else if (booking != null) {
            LocalDate now = LocalDate.now();
            if (booking.getStatus() == com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus.CONFIRMED) {
                if (now.isAfter(booking.getEndDate())) {
                    LocalDate cutoff = booking.getEndDate().plusDays(45);
                    if (now.isAfter(cutoff)) {
                        isReadOnly = true;
                    }
                }
            } else if (booking.getStatus() == com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus.CANCELLED && booking.getTransactionId() != null) {
                LocalDate cancellationDate = booking.getUpdatedAt() != null
                        ? booking.getUpdatedAt().toLocalDate()
                        : (booking.getCreatedAt() != null ? booking.getCreatedAt().toLocalDate() : now);
                if (now.isAfter(cancellationDate.plusDays(45))) {
                    isReadOnly = true;
                }
            }
        }

        // Extraer primera foto de imagen o placeholder si existe
        String thumbnail = null;
        if (listing.getAccommodation() != null && listing.getAccommodation().getImages() != null && !listing.getAccommodation().getImages().isEmpty()) {
            thumbnail = listing.getAccommodation().getImages().get(0).getImageUrl();
        }

        return new ConversationSummaryDto(
            conversation.getId(),
            listing.getId(),
            listing.getTitle(),
            thumbnail,
            listing.getPricePerMonth(),
            interlocutor.getId(),
            interlocutor.getFullName(),
            interlocutor.getProfilePicUrl(),
            bookingId,
            statusStr,
            startDate,
            endDate,
            conversation.getLastMessagePreview(),
            conversation.getLastMessageAt(),
            unread != null ? unread : 0,
            interlocutorUnread != null ? interlocutorUnread : 0,
            archived,
            isCurrentUserHost,
            isReported,
            isReadOnly
        );
    }
}
