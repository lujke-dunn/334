package com.example.messageservice.repository;

import com.example.messageservice.model.Conversation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByBookingId(Long id);

    @Query("SELECT c FROM Conversation c WHERE c.customerId = :customerId ORDER BY c.lastMessageTime DESC")
    Page<Conversation> findByCustomerId(@Param("customerId") Long customerId, Pageable pageable);

    @Query("SELECT c FROM Conversation c WHERE c.contractorId = :contractorID ORDER BY c.lastMessageTime DESC")
    Page<Conversation> findByContractorId(@Param("contractorID") Long contractorID, Pageable pageable);

    @Query("SELECT COUNT(c) > 0 FROM Conversation c WHERE c.id = :conversationId AND " + "(c.customerId = :userId OR c.customerId = :userId)")
    boolean isUserParticipant(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
