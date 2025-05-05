package com.servicemanagement.dto.request;

import com.servicemanagement.models.ServiceCategory;
import lombok.Data;

import java.math.BigDecimal;


@Data
public class ServiceSearchRequest {
    private String searchTerm;
    private ServiceCategory category;
    private String location;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String availableDay;
    private Double longitude;
    private Double latitude;
    private Integer radius;
    private Boolean featuredOnly = false;
    private Integer minRating;
    private Integer page = 0;
    private Integer pageSize = 10;
    private String sortBy = "createdAt";
    private String sortOrder = "desc";
}
