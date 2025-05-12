package com.example.bookingservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Customer Information
    @Column(nullable = false)
    private Long customerId;

    private String customerName;
    private String customerEmail;

    // Contractor Information
    @Column(nullable = false)
    private Long contractorId;

    private String contractorName;
    private String contractorEmail;

    // Service Information
    @Column(nullable = false)
    private Long serviceId;

    private String serviceName;
    private String serviceDescription;

    @Enumerated(EnumType.STRING)
    private ServiceCategory serviceCategory;

    // Booking Details
    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    private String location;

    @Column(nullable = false)
    private BigDecimal price;

    private String notes;

    @Column(length = 1000)
    private String specialRequirements;
    private Boolean specialRequirementsAcknowledged;

    // Status and Payment
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    private String paymentMethod;
    private String paymentReference;
    private LocalDateTime paymentDate;

    // Service timing
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;

    // Cancellation
    private Boolean cancelledByCustomer;
    private Boolean cancelledByContractor;
    private String cancellationReason;
    private LocalDateTime cancellationTime;
    private BigDecimal cancellationFee;
    private Boolean cancellationFeePaid;

    // No-show
    private Boolean customerNoShow;
    private Boolean contractorNoShow;
    private Long noShowReportedBy;
    private LocalDateTime noShowReportTime;

    // Review
    private Integer customerRating;
    private String customerReview;
    private LocalDateTime reviewDate;

    private Integer contractorRating;
    private String contractorReview;
    private LocalDateTime contractorReviewDate;

    // Dispute
    private Boolean hasDispute;
    private String disputeReason;
    private Long disputeReportedBy;
    private LocalDateTime disputeTime;

    @Enumerated(EnumType.STRING)
    private DisputeStatus disputeStatus;

    // Timestamps
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Version for optimistic locking
    @Version
    private Long version;

    // Helper methods for status transitions
    public boolean isUpcoming() {
        return status == BookingStatus.CONFIRMED && startTime.isAfter(LocalDateTime.now());
    }

    public boolean isInProgress() {
        LocalDateTime now = LocalDateTime.now();
        return status == BookingStatus.CONFIRMED &&
                startTime.isBefore(now) &&
                endTime.isAfter(now);
    }

    public boolean isCompleted() {
        return status == BookingStatus.COMPLETED;
    }

    public boolean isPaid() {
        return paymentStatus == PaymentStatus.PAID;
    }

    public boolean isCancelled() {
        return status == BookingStatus.CANCELLED;
    }
}