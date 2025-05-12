package com.example.bookingservice.dto;

import com.example.bookingservice.model.BookingStatus;
import com.example.bookingservice.model.DisputeStatus;
import com.example.bookingservice.model.PaymentStatus;
import com.example.bookingservice.model.ServiceCategory;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingResponse {
    private Long id;

    // Customer info
    private Long customerId;
    private String customerName;
    private String customerEmail;

    // Contractor info
    private Long contractorId;
    private String contractorName;
    private String contractorEmail;

    // Service info
    private Long serviceId;
    private String serviceName;
    private String serviceDescription;
    private ServiceCategory serviceCategory;

    // Booking details
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    private String location;
    private BigDecimal price;
    private String notes;
    private String specialRequirements;

    // Status and timing
    private BookingStatus status;
    private PaymentStatus paymentStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime actualStartTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime actualEndTime;

    // Cancellation details
    private Boolean cancelledByCustomer;
    private Boolean cancelledByContractor;
    private String cancellationReason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime cancellationTime;
    private BigDecimal cancellationFee;

    // No-show details
    private Boolean customerNoShow;
    private Boolean contractorNoShow;

    // Review details
    private Integer customerRating;
    private String customerReview;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime reviewDate;

    // Dispute information
    private Boolean hasDispute;
    private String disputeReason;
    private DisputeStatus disputeStatus;

    // Timestamps
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}