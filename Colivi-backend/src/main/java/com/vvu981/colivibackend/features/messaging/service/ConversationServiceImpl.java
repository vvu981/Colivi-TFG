package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.dto.ConversationSummaryDto;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.service.validator.MessageAccessPolicyValidator;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final AccommodationListingRepository listingRepository;
    private final UserRepository userRepository;
    private final BookingRequestRepository bookingRequestRepository;
    private final MessageAccessPolicyValidator accessPolicyValidator;
    private final ReportRepository reportRepository;

    @Override
    @Transactional
    public Conversation getOrCreateConsultation(UUID tenantId, UUID listingId) {
        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inquilino no encontrado con ID: " + tenantId));

        AccommodationListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Anuncio no encontrado con ID: " + listingId));

        User host = listing.getHost();
        if (host.getId().equals(tenantId)) {
            throw new BusinessRuleValidationException("Un anfitrión no puede abrir un canal de consulta sobre su propio anuncio.");
        }

        return conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, host.getId(), listingId)
                .orElseGet(() -> {
                    Conversation newConversation = Conversation.builder()
                            .listing(listing)
                            .tenant(tenant)
                            .host(host)
                            .lastMessageAt(LocalDateTime.now())
                            .lastMessagePreview("Consulta iniciada")
                            .tenantUnreadCount(0)
                            .hostUnreadCount(0)
                            .userMessageCount(0)
                            .nudgeSent(false)
                            .archivedByHost(false)
                            .archivedByTenant(false)
                            .build();
                    return conversationRepository.save(newConversation);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Conversation getConversationById(UUID conversationId, UUID requesterId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        accessPolicyValidator.validateCanAccessConversation(conversation, requesterId);
        return conversation;
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationSummaryDto getConversationSummary(UUID conversationId, UUID requesterId) {
        Conversation conversation = getConversationById(conversationId, requesterId);
        boolean isReported = reportRepository.existsByTargetTypeAndTargetId(ReportTargetType.CONVERSATION, conversationId);
        return ConversationSummaryDto.fromEntity(conversation, requesterId, isReported);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationSummaryDto> getInbox(UUID userId, boolean archived, Pageable pageable) {
        Page<Conversation> page = conversationRepository.findInboxByUserId(userId, archived, pageable);
        List<UUID> conversationIds = page.getContent().stream().map(Conversation::getId).toList();
        Set<UUID> reportedIds = conversationIds.isEmpty()
                ? Set.of()
                : new HashSet<>(reportRepository.findExistingReportedTargetIds(ReportTargetType.CONVERSATION, conversationIds));

        return page.map(c -> ConversationSummaryDto.fromEntity(c, userId, reportedIds.contains(c.getId())));
    }

    @Override
    @Transactional
    public void archiveConversationByHost(UUID conversationId, UUID hostId, boolean archived) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        if (!conversation.getHost().getId().equals(hostId)) {
            throw new UnauthorizedActionException("Únicamente el anfitrión tiene permisos para archivar esta consulta.");
        }

        conversationRepository.updateArchivedByHost(conversationId, archived);
    }

    @Override
    @Transactional
    public void linkBookingRequest(UUID conversationId, UUID bookingRequestId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        BookingRequest booking = bookingRequestRepository.findById(bookingRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de reserva no encontrada con ID: " + bookingRequestId));

        conversationRepository.linkActiveBookingRequest(conversationId, booking);
    }

    @Override
    @Transactional
    public void unlinkBookingRequest(UUID bookingRequestId) {
        conversationRepository.unlinkBookingRequest(bookingRequestId);
    }
}
