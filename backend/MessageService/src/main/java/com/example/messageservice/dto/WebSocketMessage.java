package com.example.messageservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
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

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
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