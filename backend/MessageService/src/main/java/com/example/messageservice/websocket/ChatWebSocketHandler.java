package com.example.messageservice.websocket;

import com.example.messageservice.dto.WebSocketMessage;
import com.example.messageservice.service.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketHandler implements WebSocketHandler {

    private final MessageService messageService;
    private final ObjectMapper objectMapper;

    // Simple session management
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());
        sessions.put(session.getId(), session);

        // Send welcome message
        WebSocketMessage welcomeMessage = WebSocketMessage.builder()
                .type(WebSocketMessage.MessageType.SYSTEM)
                .content("Connected successfully")
                .build();

        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(welcomeMessage)));
    }

    // This is the correct method signature for WebSocketHandler
    @Override
    public void handleMessage(WebSocketSession session, org.springframework.web.socket.WebSocketMessage<?> message) throws Exception {
        if (message instanceof TextMessage) {
            handleTextMessage(session, (TextMessage) message);
        } else if (message instanceof BinaryMessage) {
            // Handle binary messages if needed
            log.warn("Binary messages not supported yet");
        }
    }

    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            WebSocketMessage wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);

            // Handle different message types
            switch (wsMessage.getType()) {
                case TEXT:
                case IMAGE:
                case FILE:
                    // Process the message
                    messageService.sendMessage(wsMessage);

                    // Broadcast to other participants (simplified)
                    broadcastToOthers(session, wsMessage);
                    break;

                default:
                    log.warn("Unsupported message type: {}", wsMessage.getType());
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage());
            sendErrorMessage(session, "Error processing message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("WebSocket connection closed: {} with status: {}", session.getId(), closeStatus);
        sessions.remove(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
        sessions.remove(session.getId());
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    private void broadcastToOthers(WebSocketSession senderSession, WebSocketMessage message) {
        String messageJson;
        try {
            messageJson = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("Error serializing message: {}", e.getMessage());
            return;
        }

        sessions.values().forEach(session -> {
            if (session.isOpen() && !session.getId().equals(senderSession.getId())) {
                try {
                    session.sendMessage(new TextMessage(messageJson));
                } catch (Exception e) {
                    log.error("Error sending message to session {}: {}", session.getId(), e.getMessage());
                }
            }
        });
    }

    private void sendErrorMessage(WebSocketSession session, String errorMessage) {
        try {
            WebSocketMessage errorMsg = WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.ERROR)
                    .content(errorMessage)
                    .build();

            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorMsg)));
        } catch (Exception e) {
            log.error("Error sending error message to session {}: {}", session.getId(), e.getMessage());
        }
    }
}