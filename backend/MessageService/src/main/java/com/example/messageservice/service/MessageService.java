package com.example.messageservice.service;

import com.example.messageservice.dto.WebSocketMessage;
import com.example.messageservice.model.Conversation;
import com.example.messageservice.model.Message;
import com.example.messageservice.model.MessageType;
import com.example.messageservice.model.UserType;
import com.example.messageservice.repository.ConversationRepository;
import com.example.messageservice.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    @Transactional
    public Message sendMessage(WebSocketMessage wsMessage) {
        // Validate conversation exists
        Conversation conversation = conversationRepository.findById(wsMessage.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Create message based on type
        Message message = Message.builder()
                .conversationId(wsMessage.getConversationId())
                .senderId(wsMessage.getSenderId())
                .senderType(mapToUserType(wsMessage.getSenderType())) // Convert String to UserType
                .content(wsMessage.getContent())
                .messageType(mapToMessageType(wsMessage.getType()))
                .attachmentData(wsMessage.getAttachmentData())
                .attachmentFilename(wsMessage.getAttachmentFilename())
                .build();

        // If it's an attachment, calculate size
        if (message.getAttachmentData() != null) {
            // Remove data URL prefix and calculate size
            String base64Data = message.getAttachmentData();
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            try {
                byte[] decoded = java.util.Base64.getDecoder().decode(base64Data);
                message.setAttachmentSize((long) decoded.length);
            } catch (Exception e) {
                log.warn("Failed to calculate attachment size: {}", e.getMessage());
            }
        }

        // Save message
        Message savedMessage = messageRepository.save(message);

        // Update conversation with the correct method name
        conversation.updateLastMessageTime(LocalDateTime.now());

        // Update unread counts using your method names
        if (UserType.CUSTOMER.equals(savedMessage.getSenderType())) {
            conversation.incrementContractorUnreadCount(); // Customer sends, contractor gets unread message
        } else if (UserType.CONTRACTOR.equals(savedMessage.getSenderType())) {
            conversation.incrementCustomerUnreadCount(); // Contractor sends, customer gets unread message
        }

        conversationRepository.save(conversation);

        log.info("Message sent: {} in conversation {}", savedMessage.getId(), conversation.getId());
        return savedMessage;
    }

    private UserType mapToUserType(String senderType) {
        if ("CUSTOMER".equalsIgnoreCase(senderType)) {
            return UserType.CUSTOMER;
        } else if ("CONTRACTOR".equalsIgnoreCase(senderType)) {
            return UserType.CONTRACTOR;
        } else {
            throw new IllegalArgumentException("Invalid sender type: " + senderType);
        }
    }

    private MessageType mapToMessageType(WebSocketMessage.MessageType type) {
        return switch (type) {
            case TEXT -> MessageType.TEXT;
            case IMAGE -> MessageType.IMAGE;
            case FILE -> MessageType.FILE;
            case SYSTEM -> MessageType.SYSTEM;
            default -> MessageType.TEXT;
        };
    }
}