package com.example.messageservice.websocket;

import com.example.messageservice.dto.WebSocketMessage;
import com.example.messageservice.model.Message;
import com.example.messageservice.service.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketHandler implements WebSocketHandler {

    private final MessageService messageService;
    private final ObjectMapper objectMapper = createObjectMapper();

    // Session management by conversation
    private final Map<Long, Set<WebSocketSession>> conversationSessions = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionToConversation = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionToUser = new ConcurrentHashMap<>();

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());

        // Send welcome message immediately - don't require conversationId
        sendToSession(session, WebSocketMessage.builder()
                .type(WebSocketMessage.MessageType.SYSTEM)
                .content("Connected successfully")
                .sendTime(LocalDateTime.now())
                .build());

        // Extract conversation and user info from query parameters (optional)
        String query = session.getUri().getQuery();
        if (query != null) {
            String[] params = query.split("&");
            Long conversationId = null;
            Long userId = null;

            for (String param : params) {
                String[] keyValue = param.split("=");
                if (keyValue.length == 2) {
                    if ("conversationId".equals(keyValue[0])) {
                        conversationId = Long.valueOf(keyValue[1]);
                    } else if ("userId".equals(keyValue[0])) {
                        userId = Long.valueOf(keyValue[1]);
                    }
                }
            }

            // Only join conversation if BOTH parameters are provided
            if (conversationId != null && userId != null) {
                joinConversation(session, conversationId, userId);
            }
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, org.springframework.web.socket.WebSocketMessage<?> message) throws Exception {
        if (message instanceof TextMessage) {
            handleTextMessage(session, (TextMessage) message);
        } else if (message instanceof BinaryMessage) {
            log.warn("Binary messages not supported yet");
        }
    }

    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            WebSocketMessage wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            wsMessage.setSendTime(LocalDateTime.now());

            log.info("Received WebSocket message: type={}, conversationId={}, senderId={}",
                    wsMessage.getType(), wsMessage.getConversationId(), wsMessage.getSenderId());

            // Handle different message types
            switch (wsMessage.getType()) {
                case AUTH:
                    handleAuthMessage(session, wsMessage);
                    break;

                case CONNECTION:
                    handleJoinConversation(session, wsMessage);
                    break;

                case HEARTBEAT:
                    handleHeartbeat(session, wsMessage);
                    break;

                case TEXT:
                case IMAGE:
                case FILE:
                    handleChatMessage(session, wsMessage);
                    break;

                case TYPING_INDICATOR:
                    handleTypingIndicator(session, wsMessage);
                    break;

                case READ_RECEIPT:
                    handleReadReceipt(session, wsMessage);
                    break;

                default:
                    log.warn("Unsupported message type: {}", wsMessage.getType());
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage(), e);
            sendErrorMessage(session, "Error processing message: " + e.getMessage());
        }
    }

    private void handleJoinConversation(WebSocketSession session, WebSocketMessage wsMessage) {
        if (wsMessage.getConversationId() != null && wsMessage.getSenderId() != null) {
            joinConversation(session, wsMessage.getConversationId(), wsMessage.getSenderId());

            sendToSession(session, WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.SYSTEM)
                    .content("Joined conversation " + wsMessage.getConversationId())
                    .sendTime(LocalDateTime.now())
                    .build());
        }
    }


    private void handleAuthMessage(WebSocketSession session, WebSocketMessage wsMessage) {
        try {
            // For now, we'll accept any auth message and consider it valid
            // In production, you'd validate the token here
            log.info("Auth message received from user: {}", wsMessage.getSenderId());

            // Send success response
            sendToSession(session, WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.SYSTEM)
                    .content("Authentication successful")
                    .sendTime(LocalDateTime.now())
                    .build());

        } catch (Exception e) {
            log.error("Error handling auth message: {}", e.getMessage());
            sendErrorMessage(session, "Authentication failed");
        }
    }

    private void handleConnectionMessage(WebSocketSession session, WebSocketMessage wsMessage) {
        // Handle connection-related messages
        sendToSession(session, WebSocketMessage.builder()
                .type(WebSocketMessage.MessageType.SYSTEM)
                .content("Connection established")
                .sendTime(LocalDateTime.now())
                .build());
    }

    private void handleHeartbeat(WebSocketSession session, WebSocketMessage wsMessage) {
        // Respond to heartbeat to keep connection alive
        sendToSession(session, WebSocketMessage.builder()
                .type(WebSocketMessage.MessageType.HEARTBEAT)
                .content("pong")
                .sendTime(LocalDateTime.now())
                .build());
    }

    private void handleChatMessage(WebSocketSession session, WebSocketMessage wsMessage) {
        try {
            // Validate required fields
            if (wsMessage.getConversationId() == null || wsMessage.getSenderId() == null) {
                sendErrorMessage(session, "ConversationId and SenderId are required");
                return;
            }

            // Process and save the message
            Message savedMessage = messageService.sendMessage(wsMessage);

            // Create response message with the saved message ID
            WebSocketMessage responseMessage = WebSocketMessage.builder()
                    .type(wsMessage.getType())
                    .conversationId(wsMessage.getConversationId())
                    .senderId(wsMessage.getSenderId())
                    .senderType(wsMessage.getSenderType())
                    .content(wsMessage.getContent())
                    .attachmentData(wsMessage.getAttachmentData())
                    .attachmentFilename(wsMessage.getAttachmentFilename())
                    .messageId(savedMessage.getId())
                    .sendTime(savedMessage.getCreatedAt())
                    .build();

            // Broadcast to all participants in the conversation
            broadcastToConversation(wsMessage.getConversationId(), responseMessage, session.getId());

        } catch (Exception e) {
            log.error("Error handling chat message: {}", e.getMessage(), e);
            sendErrorMessage(session, "Failed to send message: " + e.getMessage());
        }
    }

    private void handleTypingIndicator(WebSocketSession session, WebSocketMessage wsMessage) {
        // Broadcast typing indicator to other participants (don't save to database)
        broadcastToConversation(wsMessage.getConversationId(), wsMessage, session.getId());
    }

    private void handleReadReceipt(WebSocketSession session, WebSocketMessage wsMessage) {
        // Broadcast read receipt to other participants
        broadcastToConversation(wsMessage.getConversationId(), wsMessage, session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("WebSocket connection closed: {} with status: {}", session.getId(), closeStatus);
        removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
        removeSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private void joinConversation(WebSocketSession session, Long conversationId, Long userId) {
        conversationSessions.computeIfAbsent(conversationId, k -> new CopyOnWriteArraySet<>()).add(session);
        sessionToConversation.put(session.getId(), conversationId);
        sessionToUser.put(session.getId(), userId);

        log.info("User {} joined conversation {} via session {}", userId, conversationId, session.getId());
    }

    private void removeSession(WebSocketSession session) {
        String sessionId = session.getId();
        Long conversationId = sessionToConversation.remove(sessionId);
        Long userId = sessionToUser.remove(sessionId);

        if (conversationId != null) {
            Set<WebSocketSession> sessions = conversationSessions.get(conversationId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    conversationSessions.remove(conversationId);
                }
            }
            log.info("User {} left conversation {} via session {}", userId, conversationId, sessionId);
        }
    }

    private void broadcastToConversation(Long conversationId, WebSocketMessage message, String excludeSessionId) {
        Set<WebSocketSession> sessions = conversationSessions.get(conversationId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No active sessions for conversation {}", conversationId);
            return;
        }

        String messageJson;
        try {
            messageJson = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("Error serializing message: {}", e.getMessage());
            return;
        }

        sessions.forEach(session -> {
            if (session.isOpen() && !session.getId().equals(excludeSessionId)) {
                try {
                    session.sendMessage(new TextMessage(messageJson));
                    log.debug("Message sent to session {} in conversation {}", session.getId(), conversationId);
                } catch (Exception e) {
                    log.error("Error sending message to session {}: {}", session.getId(), e.getMessage());
                    // Remove broken session
                    sessions.remove(session);
                    sessionToConversation.remove(session.getId());
                    sessionToUser.remove(session.getId());
                }
            }
        });
    }

    private void sendToSession(WebSocketSession session, WebSocketMessage message) {
        if (!session.isOpen()) {
            return;
        }

        try {
            String messageJson = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(messageJson));
        } catch (Exception e) {
            log.error("Error sending message to session {}: {}", session.getId(), e.getMessage());
        }
    }

    private void sendErrorMessage(WebSocketSession session, String errorMessage) {
        sendToSession(session, WebSocketMessage.builder()
                .type(WebSocketMessage.MessageType.ERROR)
                .content(errorMessage)
                .sendTime(LocalDateTime.now())
                .build());
    }
}