package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import com.vvu981.colivibackend.features.accommodation.repository.AccommodationListingRepository;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.dto.ConversationSummaryDto;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.service.validator.MessageAccessPolicyValidator;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import com.vvu981.colivibackend.features.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final AccommodationListingRepository listingRepository;
    private final UserRepository userRepository;
    private final BookingRequestRepository bookingRequestRepository;
    private final MessageAccessPolicyValidator accessPolicyValidator;
    private final ReportRepository reportRepository;
    private final TransactionTemplate transactionTemplate;

    @Override
    @Transactional
    public Conversation getOrCreateConsultation(UUID tenantId, UUID listingId) {
        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inquilino no encontrado con ID: " + tenantId));

        if (tenant.isBanned() || tenant.getDeletedAt() != null) {
            throw new BusinessRuleValidationException("Tu cuenta se encuentra suspendida o dada de baja.");
        }

        AccommodationListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Anuncio no encontrado con ID: " + listingId));

        if (listing.getBannedAt() != null || listing.getDeletedAt() != null) {
            throw new BusinessRuleValidationException("El anuncio no se encuentra disponible.");
        }

        User host = listing.getHost();
        if (host.getId().equals(tenantId)) {
            throw new BusinessRuleValidationException("Un anfitrión no puede abrir un canal de consulta sobre su propio anuncio.");
        }

        LocalDate minConfirmedDate = LocalDate.now().minusDays(45);
        LocalDateTime minCancelledDateTime = LocalDateTime.now().minusDays(45);
        List<BookingRequest> activeRequests = bookingRequestRepository.findActiveRequestsByUserAndListing(
                tenantId, listingId, minConfirmedDate, minCancelledDateTime);
        BookingRequest activeBooking = activeRequests.isEmpty() ? null : activeRequests.get(0);

        Optional<Conversation> existing = conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, host.getId(), listingId);
        if (existing.isPresent()) {
            Conversation conv = existing.get();
            syncActiveBookingRequest(conv, activeBooking);
            return conv;
        }

        // Si se trata de una NUEVA conversación, validamos disponibilidad del anuncio y del anfitrión
        if (listing.getStatus() != ListingStatus.AVAILABLE) {
            throw new BusinessRuleValidationException("El anuncio no está disponible actualmente.");
        }

        if (host.isBanned() || host.getDeletedAt() != null) {
            throw new BusinessRuleValidationException("El anfitrión de este alojamiento no se encuentra disponible.");
        }

        Conversation newConversation = Conversation.builder()
                .listing(listing)
                .tenant(tenant)
                .host(host)
                .activeBookingRequest(activeBooking)
                .lastMessageAt(LocalDateTime.now())
                .lastMessagePreview("Consulta iniciada")
                .tenantUnreadCount(0)
                .hostUnreadCount(0)
                .userMessageCount(0)
                .nudgeSent(false)
                .archivedByHost(false)
                .archivedByTenant(false)
                .build();

        return saveNewConversationSafely(newConversation, tenantId, host.getId(), listingId);
    }

    private void syncActiveBookingRequest(Conversation conv, BookingRequest activeBooking) {
        UUID currentBookingId = conv.getActiveBookingRequest() != null ? conv.getActiveBookingRequest().getId() : null;
        UUID newBookingId = activeBooking != null ? activeBooking.getId() : null;

        if (!Objects.equals(currentBookingId, newBookingId)) {
            if (activeBooking != null) {
                conversationRepository.linkActiveBookingRequest(conv.getId(), activeBooking);
                conv.setActiveBookingRequest(activeBooking);
            } else if (currentBookingId != null) {
                conversationRepository.unlinkBookingRequest(currentBookingId);
                conv.setActiveBookingRequest(null);
            }
        }
    }

    private Conversation saveNewConversationSafely(Conversation newConversation, UUID tenantId, UUID hostId, UUID listingId) {
        try {
            if (transactionTemplate != null && transactionTemplate.getTransactionManager() != null) {
                TransactionTemplate requiresNew = new TransactionTemplate(transactionTemplate.getTransactionManager());
                requiresNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                return requiresNew.execute(status -> conversationRepository.save(newConversation));
            }
            return conversationRepository.save(newConversation);
        } catch (DataIntegrityViolationException e) {
            log.warn("Conversación concurrente detectada para tenant {} y listing {}", tenantId, listingId);
            return conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId)
                    .orElseThrow(() -> e);
        }
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
        boolean isReported = reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
                requesterId, ReportTargetType.CONVERSATION, conversationId, List.of(ReportStatus.PENDING, ReportStatus.INVESTIGATING));
        return ConversationSummaryDto.fromEntity(conversation, requesterId, isReported);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationSummaryDto> getInbox(UUID userId, boolean archived, Pageable pageable) {
        Page<Conversation> page = conversationRepository.findInboxByUserId(userId, archived, pageable);
        List<UUID> conversationIds = page.getContent().stream().map(Conversation::getId).toList();
        Set<UUID> reportedIds = conversationIds.isEmpty()
                ? Set.of()
                : new HashSet<>(reportRepository.findExistingReportedTargetIdsByReporter(userId, ReportTargetType.CONVERSATION, conversationIds));

        return page.map(c -> ConversationSummaryDto.fromEntity(c, userId, reportedIds.contains(c.getId())));
    }

    @Override
    @Transactional
    public void archiveConversation(UUID conversationId, UUID userId, boolean archived) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        boolean isTenant = conversation.getTenant().getId().equals(userId);
        boolean isHost = conversation.getHost().getId().equals(userId);

        if (!isTenant && !isHost) {
            throw new UnauthorizedActionException("No tienes permisos para archivar esta conversación.");
        }

        if (isHost) {
            conversationRepository.updateArchivedByHost(conversationId, archived);
        } else {
            conversationRepository.updateArchivedByTenant(conversationId, archived);
        }
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
    public void linkBookingRequestIfExists(UUID tenantId, UUID hostId, UUID listingId, UUID bookingRequestId) {
        conversationRepository.findByTenantIdAndHostIdAndListingId(tenantId, hostId, listingId)
                .ifPresent(conversation -> {
                    log.info("Vinculando automáticamente nueva solicitud de reserva {} a conversación {}",
                            bookingRequestId, conversation.getId());
                    BookingRequest booking = bookingRequestRepository.findById(bookingRequestId)
                            .orElse(null);
                    if (booking != null) {
                        conversationRepository.linkActiveBookingRequest(conversation.getId(), booking);
                    }
                });
    }

    @Override
    @Transactional
    public void unlinkBookingRequest(UUID bookingRequestId) {
        conversationRepository.unlinkBookingRequest(bookingRequestId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadMessagesCount(UUID userId) {
        return conversationRepository.countUnreadMessagesByUserId(userId);
    }
}

