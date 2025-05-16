package com.example.messageservice.model;

import lombok.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private UserType senderType;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type")
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @Column(name = "attachment_filename")
    private String attachmentFilename;

    @Column(name = "attachment_data", columnDefinition = "LONGTEXT")
    private String attachmentData;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "edited")
    @Builder.Default
    private Boolean edited = false;

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    public void markAsEdited() {
        this.edited = true;
        this.readAt = LocalDateTime.now();
    }

    public boolean hasAttachment() {
        return (attachmentData != null && !attachmentData.isEmpty());
    }

    public boolean hasBase64Attachment() {
        return (attachmentData != null && !attachmentData.trim().isEmpty());
    }



}

