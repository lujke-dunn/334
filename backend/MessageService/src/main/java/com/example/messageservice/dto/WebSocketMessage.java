package com.example.messageservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {
    private MessageType type;
    private Long conversationId;
    private Long senderId;
    private String senderType;
    private String content;
    private String attachmentData;
    private String attachmentFilename;
    private Long messageId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sendTime;

    private String senderName;
    private String token;

    public enum MessageType {
        TEXT,
        IMAGE,
        FILE,
        SYSTEM,
        TYPING_INDICATOR,
        READ_RECEIPT,
        ERROR,
        AUTH,
        CONNECTION,
        HEARTBEAT
    }

}
