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
        // Skip saving control messages (AUTH, CONNECTION, HEARTBEAT, etc.)
        if (isControlMessage(wsMessage.getType())) {
            log.debug("Skipping save for control message type: {}", wsMessage.getType());
            return createVirtualMessage(wsMessage);
        }

        // Validate conversation exists for actual messages
        Conversation conversation = conversationRepository.findById(wsMessage.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Create message based on type
        Message message = Message.builder()
                .conversationId(wsMessage.getConversationId())
                .senderId(wsMessage.getSenderId())
                .senderType(mapToUserType(wsMessage.getSenderType()))
                .content(wsMessage.getContent())
                .messageType(mapToMessageType(wsMessage.getType()))
                .attachmentData(wsMessage.getAttachmentData())
                .attachmentFilename(wsMessage.getAttachmentFilename())
                .build();

        // If it's an attachment, calculate size
        if (message.getAttachmentData() != null) {
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

        // Update conversation
        conversation.updateLastMessageTime(LocalDateTime.now());

        // Update unread counts
        if (UserType.CUSTOMER.equals(savedMessage.getSenderType())) {
            conversation.incrementContractorUnreadCount();
        } else if (UserType.CONTRACTOR.equals(savedMessage.getSenderType())) {
            conversation.incrementCustomerUnreadCount();
        }

        conversationRepository.save(conversation);

        log.info("Message sent: {} in conversation {}", savedMessage.getId(), conversation.getId());
        return savedMessage;
    }

    private boolean isControlMessage(WebSocketMessage.MessageType type) {
        return type == WebSocketMessage.MessageType.AUTH ||
                type == WebSocketMessage.MessageType.CONNECTION ||
                type == WebSocketMessage.MessageType.HEARTBEAT ||
                type == WebSocketMessage.MessageType.TYPING_INDICATOR ||
                type == WebSocketMessage.MessageType.READ_RECEIPT ||
                type == WebSocketMessage.MessageType.ERROR;
    }

    private Message createVirtualMessage(WebSocketMessage wsMessage) {
        // Create a virtual message for control messages (not saved to database)
        return Message.builder()
                .id(-1L) // Virtual ID
                .conversationId(wsMessage.getConversationId())
                .senderId(wsMessage.getSenderId())
                .senderType(mapToUserType(wsMessage.getSenderType()))
                .content(wsMessage.getContent())
                .messageType(MessageType.SYSTEM)
                .createdAt(LocalDateTime.now())
                .build();
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
            case AUTH, CONNECTION, HEARTBEAT, TYPING_INDICATOR, READ_RECEIPT, ERROR -> MessageType.SYSTEM;
            default -> MessageType.TEXT;
        };
    }
}