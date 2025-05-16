package com.example.messageservice.repository;

import com.example.messageservice.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Find messages for a conversation with pagination
    Page<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId, Pageable pageable);

    // Find latest message for a conversation
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId " +
            "ORDER BY m.createdAt DESC")
    List<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    // Mark messages as read
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP " +
            "WHERE m.conversationId = :conversationId AND m.senderId != :userId AND m.isRead = false")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}