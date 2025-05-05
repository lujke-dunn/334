package com.servicemanagement.dto.request;

import com.servicemanagement.models.ServiceCategory;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

@Data
public class ServiceListingRequest {
    private String name;
    private String title;
    private String description;
    private BigDecimal price;
    private Integer durationMinutes;
    private ServiceCategory category;
    private String location;
    private Double latitude;
    private Double longitude;
    private Integer serviceRadius;
    private Boolean inHomeService;
    private Boolean outHomeService;
    private Boolean emergencyService;
    private Set<String> availableDays;
    private String availableHoursStart;
    private String availableHoursEnd;
}
