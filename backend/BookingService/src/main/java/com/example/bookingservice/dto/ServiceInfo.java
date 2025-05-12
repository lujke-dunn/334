package com.example.bookingservice.dto;

import com.example.bookingservice.model.ServiceCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInfo {
    private Long id;
    private String name;
    private String description;
    private ServiceCategory category;
    private BigDecimal price;
    private Integer durationMinutes;
    private Long contractorId;
    private String contractorName;
    private String contractorEmail;
}