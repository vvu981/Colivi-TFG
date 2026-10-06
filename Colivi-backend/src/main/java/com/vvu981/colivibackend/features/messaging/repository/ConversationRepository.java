package com.vvu981.colivibackend.features.messaging.repository;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

        @Query("SELECT c FROM Conversation c " +
                        "WHERE c.tenant.id = :tenantId AND c.host.id = :hostId AND c.listing.id = :listingId")
        Optional<Conversation> findByTenantIdAndHostIdAndListingId(
                        @Param("tenantId") UUID tenantId,
                        @Param("hostId") UUID hostId,
                        @Param("listingId") UUID listingId);

        // ─── Consultas de Bandeja de Entrada (Inbox) ────────────────────────────────

        @EntityGraph(attributePaths = {
                "listing",
                "listing.accommodation",
                "tenant",
                "host",
                "activeBookingRequest"
        })
        @Query("SELECT c FROM Conversation c " +
                        "WHERE (c.tenant.id = :userId AND c.archivedByTenant = :archived) " +
                        "   OR (c.host.id = :userId AND c.archivedByHost = :archived) " +
                        "ORDER BY c.lastMessageAt DESC")
        Page<Conversation> findInboxByUserId(
                        @Param("userId") UUID userId,
                        @Param("archived") boolean archived,
                        Pageable pageable);

        // ─── Actualizaciones Atómicas Nativas (Sin @Version) ─────────────────────────

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET " +
                        "c.lastMessageAt = :now, " +
                        "c.lastMessagePreview = :preview, " +
                        "c.hostUnreadCount = c.hostUnreadCount + 1, " +
                        "c.userMessageCount = c.userMessageCount + 1, " +
                        "c.archivedByHost = false " +
                        "WHERE c.id = :conversationId")
        int incrementHostUnreadAndSetLastMessage(
                        @Param("conversationId") UUID conversationId,
                        @Param("preview") String preview,
                        @Param("now") LocalDateTime now);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET " +
                        "c.lastMessageAt = :now, " +
                        "c.lastMessagePreview = :preview, " +
                        "c.tenantUnreadCount = c.tenantUnreadCount + 1, " +
                        "c.userMessageCount = c.userMessageCount + 1, " +
                        "c.archivedByTenant = false " +
                        "WHERE c.id = :conversationId")
        int incrementTenantUnreadAndSetLastMessage(
                        @Param("conversationId") UUID conversationId,
                        @Param("preview") String preview,
                        @Param("now") LocalDateTime now);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET " +
                        "c.nudgeSent = true " +
                        "WHERE c.id = :conversationId AND c.nudgeSent = false AND c.activeBookingRequest IS NULL")
        int claimNudge(@Param("conversationId") UUID conversationId);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET " +
                        "c.tenantUnreadCount = c.tenantUnreadCount + 1, " +
                        "c.nudgeSent = true " +
                        "WHERE c.id = :conversationId AND c.nudgeSent = false AND c.activeBookingRequest IS NULL")
        int claimNudgeWithTenantUnread(@Param("conversationId") UUID conversationId);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET " +
                        "c.lastMessageAt = :now, " +
                        "c.lastMessagePreview = :preview " +
                        "WHERE c.id = :conversationId")
        int updateLastMessage(
                        @Param("conversationId") UUID conversationId,
                        @Param("preview") String preview,
                        @Param("now") LocalDateTime now);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET c.tenantUnreadCount = 0 WHERE c.id = :conversationId")
        int resetTenantUnreadCount(@Param("conversationId") UUID conversationId);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET c.hostUnreadCount = 0 WHERE c.id = :conversationId")
        int resetHostUnreadCount(@Param("conversationId") UUID conversationId);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET c.archivedByHost = :archived WHERE c.id = :conversationId")
        int updateArchivedByHost(
                        @Param("conversationId") UUID conversationId,
                        @Param("archived") boolean archived);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET c.archivedByTenant = :archived WHERE c.id = :conversationId")
        int updateArchivedByTenant(
                        @Param("conversationId") UUID conversationId,
                        @Param("archived") boolean archived);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET c.activeBookingRequest = :bookingRequest WHERE c.id = :conversationId")
        int linkActiveBookingRequest(
                        @Param("conversationId") UUID conversationId,
                        @Param("bookingRequest") BookingRequest bookingRequest);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET c.activeBookingRequest = null WHERE c.activeBookingRequest.id = :bookingRequestId")
        int unlinkBookingRequest(@Param("bookingRequestId") UUID bookingRequestId);

        @Modifying(flushAutomatically = true)
        @Query("UPDATE Conversation c SET c.activeBookingRequest = null WHERE c.activeBookingRequest.id IN :bookingRequestIds")
        int unlinkBookingRequests(@Param("bookingRequestIds") java.util.Collection<UUID> bookingRequestIds);

        @Query("SELECT COALESCE(SUM(CASE WHEN c.tenant.id = :userId THEN c.tenantUnreadCount ELSE c.hostUnreadCount END), 0) " +
               "FROM Conversation c " +
               "WHERE (c.tenant.id = :userId AND c.archivedByTenant = false) " +
               "   OR (c.host.id = :userId AND c.archivedByHost = false)")
        long countUnreadMessagesByUserId(@Param("userId") UUID userId);
}
