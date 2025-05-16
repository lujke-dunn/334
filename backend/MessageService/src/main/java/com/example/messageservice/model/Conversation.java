package com.example.messageservice.model;

import lombok.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "contractor_id", nullable = false)
    private Long contractorId;

    @Column(name = "last_message_time")
    private LocalDateTime lastMessageTime;

    @Column(name = "customer_unread_count")
    @Builder.Default
    private Integer customerUnreadCount = 0;

    @Column(name = "contractor_unread_count")
    @Builder.Default
    private Integer contractorUnreadCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    public void incrementCustomerUnreadCount() {
        this.customerUnreadCount++;
    }

    public void incrementContractorUnreadCount() {
        this.contractorUnreadCount++;
    }

    public void resetCustomerUnreadCount() {
        this.customerUnreadCount = 0;
    }

    public void resetContractorUnreadCount() {
        this.contractorUnreadCount = 0;
    }

    public void updateLastMessageTime(LocalDateTime lastMessageTime) {
        this.lastMessageTime = LocalDateTime.now();
    }
}

enum ConversationStatus {
    ACTIVE,
    ARCHIVED,
    BLOCKED
}
