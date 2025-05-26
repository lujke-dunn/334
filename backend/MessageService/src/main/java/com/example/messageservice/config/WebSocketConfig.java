package com.example.messageservice.config;

import com.example.messageservice.websocket.ChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;



    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Native WebSocket endpoint (no SockJS)
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOriginPatterns("*");

        // SockJS fallback endpoint
        registry.addHandler(chatWebSocketHandler, "/ws/chat-sockjs")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        System.out.println("✅ WebSocket handlers registered:");
        System.out.println("   - Native WebSocket: ws://localhost:8084/ws/chat");
        System.out.println("   - SockJS endpoint: http://localhost:8084/ws/chat-sockjs");
    }
}