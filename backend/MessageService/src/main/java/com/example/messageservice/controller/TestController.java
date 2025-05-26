package com.example.messageservice.controller;

import com.example.messageservice.model.Conversation;
import com.example.messageservice.model.Message;
import com.example.messageservice.repository.ConversationRepository;
import com.example.messageservice.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/test")
public class TestController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "message-service");
        response.put("timestamp", System.currentTimeMillis());

        // Check database connectivity
        try {
            long conversationCount = conversationRepository.count();
            long messageCount = messageRepository.count();

            response.put("database", "Connected");
            response.put("conversationCount", conversationCount);
            response.put("messageCount", messageCount);
        } catch (Exception e) {
            response.put("database", "Error: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            stats.put("totalConversations", conversationRepository.count());
            stats.put("totalMessages", messageRepository.count());
            stats.put("activeConversations", conversationRepository.findAll().size());
        } catch (Exception e) {
            stats.put("error", e.getMessage());
        }

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/websocket-info")
    public ResponseEntity<Map<String, Object>> getWebSocketInfo() {
        Map<String, Object> info = new HashMap<>();

        info.put("availableEndpoints", Arrays.asList(
                "ws://localhost:8084/ws/chat",
                "ws://localhost:8084/ws/chat-sockjs/websocket"
        ));

        info.put("testInstructions", Arrays.asList(
                "1. Make sure the service is running on port 8084",
                "2. Try the Native WebSocket option first",
                "3. If that fails, try the SockJS WebSocket option",
                "4. Check browser console for detailed error messages"
        ));

        info.put("serverTime", System.currentTimeMillis());

        return ResponseEntity.ok(info);
    }

    @PostMapping("/reset-test-data")
    public ResponseEntity<Map<String, String>> resetTestData() {
        try {
            // Clear existing data
            messageRepository.deleteAll();
            conversationRepository.deleteAll();

            return ResponseEntity.ok(Map.of(
                    "message", "Test data reset successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "error", "Failed to reset test data: " + e.getMessage()
            ));
        }
    }
}