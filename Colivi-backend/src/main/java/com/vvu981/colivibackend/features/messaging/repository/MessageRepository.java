package com.vvu981.colivibackend.features.messaging.repository;

import com.vvu981.colivibackend.features.messaging.domain.Message;
import com.vvu981.colivibackend.features.messaging.domain.MessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query(value = "SELECT m FROM Message m LEFT JOIN FETCH m.sender " +
           "WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.createdAt DESC",
           countQuery = "SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId")
    Page<Message> findByConversationIdOrderByCreatedAtDesc(
            @Param("conversationId") UUID conversationId,
            Pageable pageable
    );

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.sender " +
           "WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.createdAt ASC")
    java.util.List<Message> findAllByConversationIdOrderByCreatedAtAsc(
            @Param("conversationId") UUID conversationId
    );

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.sender " +
           "WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.createdAt ASC")
    java.util.List<Message> findTopMessagesByConversationId(
            @Param("conversationId") UUID conversationId,
            Pageable pageable
    );

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Message m SET m.status = :status, m.readAt = :now " +
           "WHERE m.conversation.id = :conversationId " +
           "  AND (m.sender.id != :readerId OR m.sender IS NULL) " +
           "  AND m.status != :status")
    int markIncomingMessagesAsRead(
            @Param("conversationId") UUID conversationId,
            @Param("readerId") UUID readerId,
            @Param("status") MessageStatus status,
            @Param("now") LocalDateTime now
    );
}
