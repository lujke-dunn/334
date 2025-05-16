package com.example.messageservice.controller;

import com.example.messageservice.model.Conversation;
import com.example.messageservice.model.Message;
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
import java.util.stream.Collectors;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations() {
        List<Conversation> conversations = conversationRepository.findAll();

        List<Map<String, Object>> formattedConversations = conversations.stream()
                .map(conv -> {
                    Map<String, Object> formatted = new HashMap<>();
                    formatted.put("id", conv.getId());
                    formatted.put("bookingId", conv.getBookingId());
                    formatted.put("serviceName", "Dog Walking Service"); // Mock data
                    formatted.put("serviceDate", "2025-05-16");
                    formatted.put("lastMessage", "Hello! I'd like to book your service.");
                    formatted.put("lastMessageTime", conv.getUpdatedAt());
                    formatted.put("customerUnreadCount", conv.getCustomerUnreadCount());
                    formatted.put("contractorUnreadCount", conv.getContractorUnreadCount());
                    formatted.put("isOnline", false);

                    // Add other user info (mock for now)
                    Map<String, Object> otherUser = new HashMap<>();
                    otherUser.put("id", conv.getCustomerId().equals(1L) ? conv.getContractorId() : conv.getCustomerId());
                    otherUser.put("name", conv.getCustomerId().equals(1L) ? "Service Provider" : "Customer");
                    otherUser.put("email", "user@example.com");
                    formatted.put("otherUser", otherUser);

                    return formatted;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(formattedConversations);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size)
    {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);

        return ResponseEntity.ok(messages.getContent());
    }

    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long conversationId) {
        return ResponseEntity.ok().build();
    }

}
