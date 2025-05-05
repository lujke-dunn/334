package com.servicemanagement.dto.response;

import com.servicemanagement.models.ServiceCategory;
import com.servicemanagement.models.ServiceStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class ServiceListingResponse {
    private Long id;
    private String name;
    private String title;
    private String description;
    private BigDecimal price;
    private Integer durationMinutes;
    private ServiceCategory category;

    // Contractor information
    private Long contractorID;
    private String contractorName;
    private String contractorEmail;

    // Location information
    private String location;
    private Double latitude;
    private Double longitude;
    private Integer serviceRadius;

    // Service type
    private Boolean inHomeService;
    private Boolean outHomeService;
    private Boolean emergencyService;

    // Availability
    private Set<String> availableDays;
    private String availableHoursStart;
    private String availableHoursEnd;

    // Status and metadata
    private ServiceStatus status;
    private Double averageRating;
    private Integer reviewCount;
    private Integer completedBookings;
    private Boolean featured;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}