package com.example.messageservice.controller;

import com.example.messageservice.model.Conversation;
import com.example.messageservice.model.Message;
import com.example.messageservice.model.MessageType;
import com.example.messageservice.model.UserType;
import com.example.messageservice.repository.ConversationRepository;
import com.example.messageservice.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "CUSTOMER") String userType) {

        List<Conversation> conversations;

        if (userId != null) {
            if ("CUSTOMER".equalsIgnoreCase(userType)) {
                conversations = conversationRepository.findByCustomerId(userId, Pageable.unpaged()).getContent();
            } else {
                conversations = conversationRepository.findByContractorId(userId, Pageable.unpaged()).getContent();
            }
        } else {
            conversations = conversationRepository.findAll();
        }

        List<Map<String, Object>> formattedConversations = conversations.stream()
                .map(this::formatConversation)
                .collect(Collectors.toList());

        return ResponseEntity.ok(formattedConversations);
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversation(@PathVariable Long conversationId) {
        return conversationRepository.findById(conversationId)
                .map(this::formatConversation)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/conversations/booking/{bookingId}")
    public ResponseEntity<Map<String, Object>> getConversationByBookingId(@PathVariable Long bookingId) {
        Optional<Conversation> conversation = conversationRepository.findByBookingId(bookingId);

        if (conversation.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(formatConversation(conversation.get()));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        // Verify conversation exists
        if (!conversationRepository.existsById(conversationId)) {
            return ResponseEntity.notFound().build();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Message> messagesPage = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("messages", messagesPage.getContent());
        response.put("totalElements", messagesPage.getTotalElements());
        response.put("totalPages", messagesPage.getTotalPages());
        response.put("currentPage", messagesPage.getNumber());
        response.put("hasNext", messagesPage.hasNext());
        response.put("hasPrevious", messagesPage.hasPrevious());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam String userType) {

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElse(null);

        if (conversation == null) {
            return ResponseEntity.notFound().build();
        }

        // Reset unread count based on user type
        if ("CUSTOMER".equalsIgnoreCase(userType)) {
            conversation.resetCustomerUnreadCount();
        } else if ("CONTRACTOR".equalsIgnoreCase(userType)) {
            conversation.resetContractorUnreadCount();
        }

        conversationRepository.save(conversation);

        // Mark messages as read in the database
        messageRepository.markMessagesAsRead(conversationId, userId);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/conversations")
    public ResponseEntity<Map<String, Object>> createConversation(@RequestBody Map<String, Object> request) {
        Long bookingId = Long.valueOf(request.get("bookingId").toString());
        Long customerId = Long.valueOf(request.get("customerId").toString());
        Long contractorId = Long.valueOf(request.get("contractorId").toString());

        // Check if conversation already exists for this booking
        if (conversationRepository.findByBookingId(bookingId).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Conversation already exists for this booking"));
        }

        Conversation conversation = Conversation.builder()
                .bookingId(bookingId)
                .customerId(customerId)
                .contractorId(contractorId)
                .build();

        Conversation saved = conversationRepository.save(conversation);
        return ResponseEntity.ok(formatConversation(saved));
    }

    @PostMapping("/messages")
    public ResponseEntity<Message> createMessage(@RequestBody Map<String, Object> request) {
        Long conversationId = Long.valueOf(request.get("conversationId").toString());
        Long senderId = Long.valueOf(request.get("senderId").toString());
        String content = request.get("content").toString();
        String messageTypeStr = request.getOrDefault("messageType", "TEXT").toString();
        String userTypeStr = request.get("userType").toString();

        // Verify conversation exists
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElse(null);
        if (conversation == null) {
            return ResponseEntity.notFound().build();
        }

        MessageType messageType = MessageType.valueOf(messageTypeStr.toUpperCase());
        UserType userType = UserType.valueOf(userTypeStr.toUpperCase());

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .senderType(userType)
                .content(content)
                .messageType(messageType)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        // Update conversation
        conversation.setLastMessageTime(saved.getCreatedAt());
        if (userType == UserType.CUSTOMER) {
            conversation.incrementContractorUnreadCount();
        } else {
            conversation.incrementCustomerUnreadCount();
        }
        conversationRepository.save(conversation);

        return ResponseEntity.ok(saved);
    }

    private Map<String, Object> formatConversation(Conversation conv) {
        Map<String, Object> formatted = new HashMap<>();
        formatted.put("id", conv.getId());
        formatted.put("bookingId", conv.getBookingId());
        formatted.put("customerId", conv.getCustomerId());
        formatted.put("contractorId", conv.getContractorId());
        formatted.put("lastMessageTime", conv.getLastMessageTime());
        formatted.put("customerUnreadCount", conv.getCustomerUnreadCount());
        formatted.put("contractorUnreadCount", conv.getContractorUnreadCount());
        formatted.put("status", conv.getStatus());
        formatted.put("createdAt", conv.getCreatedAt());
        formatted.put("updatedAt", conv.getUpdatedAt());

        // Get the last message for this conversation
        List<Message> lastMessages = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conv.getId());
        if (!lastMessages.isEmpty()) {
            Message lastMessage = lastMessages.get(0);
            formatted.put("lastMessage", lastMessage.getContent());
            formatted.put("lastMessageType", lastMessage.getMessageType());
            formatted.put("lastMessageSender", lastMessage.getSenderId());
        } else {
            formatted.put("lastMessage", null);
            formatted.put("lastMessageType", null);
            formatted.put("lastMessageSender", null);
        }

        return formatted;
    }
}